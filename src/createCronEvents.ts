import cronParser from 'cron-parser';
import dayjs from 'dayjs';

import db from './db';

console.log("importing file")

export const getSchedulesForDate = (cronExpression: string, date: string) => {
    console.log("calling funstion")
    const schedules = [];
    const interval = cronParser.parseExpression(cronExpression, { currentDate: new Date(date) });
  
    try {
      while (true) {
        const next = interval.next().toISOString();

        if (dayjs(next).isSame(date, 'day')) {
          schedules.push(next);
        } else {
          break;
        }
      }
    } catch (err) {
        console.log(err)
      // End of schedule
    }
  
    return schedules;
};

export const insertCronEvent = (cronId: number, scheduledTime: string, callback: Function) => {
    const checkQuery = `SELECT COUNT(*) as count FROM cron_events WHERE cron_id = ? AND scheduled_time = ?`;

    db.get(checkQuery, [cronId, scheduledTime], (err, row: any) => {
      if (err) {
        return callback(err);
      }

      if (row.count === 0) {
        const insertQuery = `INSERT INTO cron_events (cron_id, scheduled_time, created_at) VALUES (?, ?, ?)`;
        const currentTime = dayjs().toISOString();

        db.run(insertQuery, [cronId, scheduledTime, currentTime], callback);
      } else {
        callback();
      }
    });
  };
