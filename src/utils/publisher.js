import amqp from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL;


async function publishToQueue(queue, payload) {
  const conn = await amqp.connect(RABBITMQ_URL);
  const channel = await conn.createChannel();

  await channel.assertQueue(queue, { durable: true });

  channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), { persistent: true });

  console.log('[📤 Task Published]:', payload);
  await channel.close();
  await conn.close();
}

export default publishToQueue;
