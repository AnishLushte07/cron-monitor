import express from 'express';
import bodyParser from 'body-parser';
import dayjs from 'dayjs';

import db from './db';
import { insertCronEvent, getSchedulesForDate } from './createCronEvents';

interface CronEventRequest {
  cronId: number;
  scheduledTime: string;
  status: string;
}

interface AddCronRequest {
  name: string;
  cronExpression: string;
  active: boolean;
}

const app = express();

app.use(bodyParser.json());

app.get('/', (req, res) => {
  const name = process.env.NAME || 'World';
  res.send(`Hello ${name}!`);
});

app.post('/start-cron-event', (req, res) => {
  try {
    const { cronId, scheduledTime, status }: CronEventRequest = req.body;

    if (!cronId || !scheduledTime || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `UPDATE cron_events
                 SET status = ?, start_time = ?
                 WHERE cron_id = ? AND scheduled_time = ?`;

    const startTime = dayjs().toISOString();


    db.run(query, [status, startTime, cronId, scheduledTime], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(200).json({ message: 'Cron event updated successfully', changes: this.changes });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/end-cron-event', (req, res) => {
  try {
    const { cronId, scheduledTime, status }: CronEventRequest = req.body;

    if (!cronId || !scheduledTime || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `UPDATE cron_events
                 SET status = ?, end_time = ?
                 WHERE cron_id = ? AND scheduled_time = ?`;

    const endTime = dayjs().toISOString();

    db.run(query, [status, endTime, cronId, scheduledTime], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(200).json({ message: 'Cron event updated successfully', changes: this.changes });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/add-cron', (req, res) => {
  try {
    const { name, cronExpression, active }: AddCronRequest = req.body;

    if (!name || !cronExpression || active === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `INSERT INTO crons (name, cron_expression, active, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?)`;

    const currentTime = dayjs().toISOString();

    db.run(query, [name, cronExpression, active, currentTime, currentTime], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(201).json({ message: 'Cron added successfully', id: this.lastID });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/create-cron-events', (req, res) => {
  const { date } = req.body;

  if (!date || !dayjs(date, 'YYYY-MM-DD', true).isValid()) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
  }

  db.all('SELECT * FROM crons WHERE active = 1;', (err, crons: any) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    console.log(crons)

    const tasks = crons.reduce((acc: Function[], cron) => {
      const schedules = getSchedulesForDate(cron.cron_expression, date);
      schedules.forEach((scheduledTime) => {
        acc.push((cb: Function) => insertCronEvent(cron.id, scheduledTime, cb));
      });
      return acc;
    }, []);

    let completed = 0;
    tasks.forEach((task) => {
      task((err?: Error) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        completed += 1;
        if (completed === tasks.length) {
          res.status(201).json({ message: 'Cron events created successfully' });
        }
      });
    });

    if (tasks.length === 0) {
      res.status(200).json({ message: 'No cron events to create' });
    }
  });
});

app.get('/crons', (req, res) => {
  db.all('SELECT * FROM crons;', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(200).json({ crons: rows });
    }
  });
});

app.get('/cron-schedules', (req, res) => {
  const { date } = req.query;

  if (!date || !dayjs(date, 'YYYY-MM-DD', true).isValid()) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
  }

  db.all('SELECT * FROM cron_events;', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(200).json({ cronEventss: rows });
    }
  });
});

const port = parseInt(process.env.PORT || '3000');

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
