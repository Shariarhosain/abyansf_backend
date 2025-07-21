import amqp from 'amqplib';

const RABBITMQ_URL = "amqp://OU42sT8rItjfLRc5:aXZLMEaFBmR6BGfeMZzCRKT1ztEd43D5@rabbitmq-u84cgoso0swsogkok4ok4ok0.147.93.111.102.sslip.io:5672";


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
