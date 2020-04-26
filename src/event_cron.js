const cron = require('node-cron');
const db = require("./db"); 
const m = require("moment");

// console.log("HEY")
// cron.schedule('* * * * *', () => {
//   console.log('running a task every minute');
// });

const SCHED_EVERY_MINUTE = "* * * * *"
const SCHED_DAILY_8AM = "0 8 * * *"
const SCHED_DAILY_MIDNIGHT = "0 0 * * *"

module.exports = (bot) => {
    console.log(`Starting cron service...`);

    cron.schedule(SCHED_DAILY_8AM, async () => {
        const client = new db.Client();
        console.log("sending daily schedule...");
        // todo: send to all users.. 
        try {
            const resultset = await client.query(`select * from daily_schedule`);
            // todo if rows == 0, skip
    
            console.log("sending msg on telegram...");
            const schedule = [];
            schedule.push("Good morning master");
            schedule.push("Today's 💩 to deal with");
            for (let event of resultset.rows) {
                schedule.push(`${event.title} - ${m(event.start).fromNow()}`);
            }
            await bot.sendMessage(284010199, schedule.join("\n"), {parse_mode: "markdown"});
        } catch(e) {
            console.error(`failed to compile daily schedule: ${e}`);
        } finally {
            client.release();
        }
        
        console.log('...done!');
    });
    
    
    cron.schedule(SCHED_DAILY_MIDNIGHT, async () => {
        console.log("scheduling let");
        const client = new db.Client();
        console.log("scheduling events...");
        try {
        const resultset = await client.query(`select schedule_events()`);
        } catch(e) {
            console.error(`failed to run schedule events: ${e}`);
        } finally {
        client.release();
        }
        console.log('...done!');
    });
}
