-- Design
--
-- Pro's
--  * (Relatively) easy to query for user's events
--  * Very easy queries to (re)write events, get all events for event_schedule etc
-- Con's
--  * Weak access control, all calendar members are equal owners

drop table if exists calendar cascade;
drop table if exists calendar_member cascade;
drop table if exists event_data cascade;
drop table if exists event cascade;
drop table if exists event_scheduling cascade;

-- TODO: how to model who this event is applicable for..?
create table calendar (
    id serial primary key,
    title text not null
);

create table calendar_member (
    cal_id int references calendar(id) not null,
    usr_id int references public."user"(id) not null,
    primary key (usr_id, cal_id)
);

create table event_data (
    id serial primary key,
    cal_id int references calendar(id) not null,
    title text not null,
    data jsonb not null default '{}'
);

create table event (
    event_data_id int references event_data(id) not null,
    start timestamp without time zone not null,
    primary key (event_data_id, start)
);

create index concurrently "ndx_events"
    on event
    using btree(start,event_data_id);

create table event_scheduling (
    id int primary key references event_data(id) not null,
    -- time of first event in series
    start timestamp without time zone not null,

    -- only relevant for events with limited recurrence
    max_occurrences int not null default 0,

    -- compute input
    unit int not null, -- 0: daily, 1: weekly, 2: monthly, 3: yearly
    interval int not null default 0 -- 0: no skip, n: every n'th <unit>
);

-- Get events enriched with event_data
create view event_with_data as
    select ed.*, e.start
    from event e inner join event_data ed
        on e.event_data_id = ed.id;

--
-- Compute Utility Functions
--

-- Determines lookahead/horizon of each unit of recurring scheduling
-- (Where unit is daily/weekly/monthly/yearly)
-- Done because we cannot write an infinite sequence to the DB
drop function if exists unit_max_ahead(unit bigint) cascade;
create or replace function unit_max_ahead(unit bigint)
  returns int as $$
  if unit == 0: # daily
    return 5 * 30
  if unit == 1: # weekly
    return 30
  elif unit == 2: # monthly
    return 12
  elif unit == 3: # yearly
    return 3
$$ language plpython3u immutable;

-- Calculate maximum events to be scheduled atm for a given event_schedule
-- This works with multiple constraints:
--   future: number of already scheduled future events
--   unit_max_ahead: number of maximum future scheduled events for this unit
--   max_occurrences: max number of events permitted for a limited series of events
drop function if exists max_schedule(future bigint, unit_max_ahead bigint, max_occurrences bigint) cascade;
create or replace function max_schedule(future bigint, unit_max_ahead bigint, max_occurrences bigint = 0)
  returns int as $$
  if not max_occurrences or max_occurrences == 0:
    return unit_max_ahead - future
  return min(
    max(max_occurrences - future, 0),  # remaining
    max(unit_max_ahead - future, 0)
  )
$$ language plpython3u immutable;

--
-- Event Replenishment - determining when to write new event entries based
-- on event_schedule data.
--
-- For each event_schedule, we only write a limited number of future events
-- into the database. This ensures we can work with infinite or very large
-- sequences.

-- 1 row per event_schedule enriched with:
--   latest: the datetime of the LAST scheduled future event | NULL
--   future_events: number of future/scheduled events (may be zero)
drop view if exists event_schedule_count;
create view event_schedule_count as
    select es.id,
       es.max_occurrences,
       es.unit,
       es.interval,
       es.start,
       f.latest,
       coalesce(f.future_events, 0) as future_events
    from event_scheduling es
    left outer join (
        select event_data_id,
               max(start) as latest,
               count(*) as future_events
        from event
        where start > now()
        group by event_data_id) as f on es.id = f.event_data_id;


-- List of schedule_events rows where the number of scheduled events is less
-- than the maximum possible (between limited series and unit lookahead)
-- Is input for the `schedule_events` function
drop view if exists schedule_events_src;
create view schedule_events_src as
    select tbl.*
    from (select *,
           max_schedule(
               future_events,
               unit_max_ahead(unit),
               max_occurrences) as to_schedule
           from event_schedule_count) as tbl
    where tbl.to_schedule != 0;

-- Schedule new events for each event_schedule entry where this is possible
-- Running this daily is what ensures replenishment of concrete events derived
-- from the event_schedule entry.
drop function if exists schedule_events() cascade;
create or replace function schedule_events()
  returns int as $$
  from datetime import datetime
  from dateutil.relativedelta import relativedelta
  from dateutil import parser

  unit_arg = {
    0: "days",
    1: "weeks",
    2: "months",
    3: "years",
  }

  def next_date(dt, unit, n):
    return dt + relativedelta(**{unit_arg[unit]: n})

  q_ins_event = plpy.prepare(
    "INSERT INTO event (event_data_id, start) VALUES ($1, $2)",
    ["int", "timestamp without time zone"])
  q_schedule_jobs = plpy.prepare("select * from schedule_events_src", [])
  schedule_jobs = plpy.execute(q_schedule_jobs, [])
  dt_now = datetime.now()

  for job in schedule_jobs:
    event_data_id = job["id"]
    to_schedule = job["to_schedule"]
    start = job["start"]
    latest = job["latest"]
    unit = job["unit"]
    interval = job["interval"] + 1

    # TODO: determine first decent date (start/latest then loop until first future date)
    if not latest:
      offset_date = parser.parse(start)
    else:
      offset_date = next_date(parser.parse(latest), unit, interval)

    while dt_now >= offset_date:
      offset_date = next_date(offset_date, unit, interval)

    for n in range(0, to_schedule):
      plpy.execute(q_ins_event, [event_data_id, offset_date])
      offset_date = next_date(offset_date, unit, interval)
$$ language plpython3u;

-- Change event_scheduling entry
--
-- If an event_scheduling entry is changed, the already scheduled FUTURE
-- events need to be rewritten/updated to reflect the new schedule.
--
-- This trigger is installed on INSERT/UPDATE of an event_schedule entry
-- and will schedule the maximum number of events permitted (see
-- unit_max_ahead function) using the new event_schedule data.
create or replace function on_event_schedule_changed()
  returns trigger as $$
  from datetime import datetime
  from dateutil.relativedelta import relativedelta
  from dateutil import parser

  unit_arg = {
    0: "days",
    1: "weeks",
    2: "months",
    3: "years",
  }

  def next_date(dt, unit, n):
    return dt + relativedelta(**{unit_arg[unit]: n})

  dt_now = datetime.now()

  old = TD["old"]
  row = TD["new"]

  # make no changes if row hasn't changed.
  if (old
      and row["start"] == old["start"]
      and row["max_occurrences"] == old["max_occurrences"]
      and row["unit"] == old["unit"]
      and row["interval"] == old["interval"]):
    return

  event_data_id = row["id"]
  start = parser.parse(row["start"])
  max_occurrence = row["max_occurrences"] or 0
  unit = row["unit"]
  interval = row["interval"] + 1

  q_unit_max_ahead = plpy.prepare("select unit_max_ahead($1) as out", ["int"])
  unit_max_ahead = plpy.execute(q_unit_max_ahead, [unit])[0]["out"]

  # remove future events
  query_del_future_events = plpy.prepare(
    "delete from event e where e.event_data_id = $1 and e.start > now()",
    ["int"])
  plpy.execute(query_del_future_events, [event_data_id])

  q_ins_event = plpy.prepare(
    "INSERT INTO event (event_data_id, start) VALUES ($1, $2)",
    ["int", "timestamp without time zone"])

  offset_date = start
  while dt_now >= offset_date:
    offset_date = next_date(offset_date, unit, interval)

  if max_occurrence != 0:
    end = min(max_occurrence, unit_max_ahead)
  else:
    end = unit_max_ahead
  for n in range(0, end):
      plpy.execute(q_ins_event, [event_data_id, offset_date])
      offset_date = next_date(offset_date, unit, interval)
$$ language plpython3u;

drop trigger if exists create_events on event_scheduling;
create trigger create_events
    before insert or update on event_scheduling
    for each row
    execute procedure on_event_schedule_changed();

-- Get all events (enriched with event_data) for given user
create or replace function user_events(user_id int)
    returns table (
        id int,
        cal_id int,
        title text,
        data jsonb,
        start timestamp without time zone)
    as $$
    begin
        return query
            select *
            from event_with_data e
            where e.cal_id in (
                select cm.cal_id from calendar_member cm where usr_id = user_id)
            order by e.start asc;
    end; $$ language 'plpgsql';

-- TODO: user_event_schedules