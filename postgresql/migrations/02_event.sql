-- Design:
--
-- Must create an event_data entry
-- Must then create EITHER an event (non-recurring)
-- OR create an event_recurrence and trigger computation of concrete events
--
--
-- Pro's: 
-- * can express almost any setup of daily granularity
-- * easy to query for upcomin events
-- Con's:
-- * changes to event_reccurrence (aside from setting last_computed = NULL) will mean recomputing 
--   events (thus deleting and adding)

-- TODO: how to model who this event is appliccable for..?
create table event_data (
    id int primary key,
    title text not null,
    data jsonb
);

create table event (
    event_data_id int references event_data(id) not null,
    start timestamp without time zone not null,
);

create index concurrently "ndx_events"
    on event
    using btree(start,event_data_id);

create table event_scheduling (
    id int primary key references event_data(id) not null,
    -- deadline by which recomputation and repopulation of table must happen
    -- nullable, if null, no further events are computed.
    last_computed timestamp without time zone,

    -- only relevant for events with limited recurrence
    max_occurrences int,
    n_occurrence int,

    -- compute input
    unit int not null, -- 0: daily, 1: weekly, 2: monthly, 3: yearly
    separation int not null default 0, -- 0: no skip, n: every n'th <unit>

    day_of_week int,
    week_of_month int,
    day_of_month int,
    month_of_year int
);

create index concurrently "ndx_active_event_recurrences" 
    on event_recurrence
    using btree(last_computed)
    where last_computed is not null;
