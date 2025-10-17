// db.js
import 'dotenv/config'; // Substitui require('dotenv').config()
import mongoose from 'mongoose'; // Substitui const mongoose = require('mongoose')

const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
  throw new Error('Por favor, defina a variável MONGODB_URL no arquivo .env');
}

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URL); // Remova useNewUrlParser e useUnifiedTopology (obsoletos)
    console.log('Conectado ao MongoDB Atlas com sucesso!');
  } catch (error) {
    console.error('Erro na conexão com MongoDB:', error.message);
    process.exit(1);
  }
}

// Eventos de conexão (mantidos iguais)
mongoose.connection.on('connected', () => {
  console.log('Mongoose conectado ao DB');
});

mongoose.connection.on('error', (err) => {
  console.log(`Erro na conexão do Mongoose: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose desconectado do DB');
});

// Encerramento (mantido igual)
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Conexão com MongoDB encerrada devido ao término da aplicação');
  process.exit(0);
});

export default connectDB; // Substitui module.exports = connectDB