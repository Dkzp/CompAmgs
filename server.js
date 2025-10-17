// server.js - VERSÃO DEFINITIVA, COMPLETA E CORRIGIDA

// ===================================================================
//      1. IMPORTAÇÕES E CONFIGURAÇÃO
// ===================================================================

import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import connectDB from './lib/db.js';
import mongoose from 'mongoose';
import cors from 'cors';

// ---> NOVAS IMPORTAÇÕES PARA AUTENTICAÇÃO <---
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import authMiddleware from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

const port = process.env.PORT || 3001;
const apiKey = process.env.OPENWEATHER_API_KEY;

connectDB();
app.use(express.static(path.join(__dirname, "public")));


// ===================================================================
//      2. MODELOS DO MONGODB
// ===================================================================

const manutencaoSchema = new mongoose.Schema({
    data: { type: Date, required: true },
    tipo: { type: String, required: true },
    custo: { type: Number, default: 0 },
    descricao: { type: String, default: '' }
}, { _id: false });

const veiculoGaragemSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    modelo: { type: String, required: true },
    cor: String,
    imagemSrc: String,
    placa: String,
    ano: Number,
    dataVencimentoCNH: Date,
    tipoVeiculo: { type: String, required: true },
    historicoManutencao: [manutencaoSchema],
    turboAtivado: { type: Boolean, default: false },
    capacidadeCarga: { type: Number, default: 0 },
    cargaAtual: { type: Number, default: 0 },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // ---> NOVO CAMPO PARA COMPARTILHAMENTO <---
    sharedWith: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
}, { _id: false });
const VeiculoGaragem = mongoose.model('VeiculoGaragem', veiculoGaragemSchema);

const dicaSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    dica: { type: String, required: true },
    tipoVeiculo: { type: String, enum: ['geral', 'carrobase', 'carroesportivo', 'caminhao', 'moto'], default: 'geral' }
});
const Dica = mongoose.model('Dica', dicaSchema);

const veiculoDestaqueSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    modelo: { type: String, required: true },
    ano: { type: Number, required: true },
    destaque: { type: String, required: true },
    imagemUrl: { type: String, required: true }
});
const VeiculoDestaque = mongoose.model('VeiculoDestaque', veiculoDestaqueSchema);

const servicoSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    nome: { type: String, required: true },
    descricao: { type: String, required: true },
    precoEstimado: { type: String, required: true }
});
const Servico = mongoose.model('Servico', servicoSchema);

const detalhesExtrasSchema = new mongoose.Schema({
    veiculoId: { type: String, required: true, unique: true },
    valorFIPE: { type: Number, default: 0 },
    recallPendente: { type: Boolean, default: false },
    motivoRecall: { type: String, default: '' },
    dicaManutencao: { type: String, default: '' },
    proximaRevisaoRecomendada: { type: Date }
});
const DetalhesExtras = mongoose.model('DetalhesExtras', detalhesExtrasSchema);


// ===================================================================
//      3. INICIALIZAÇÃO DE DADOS PÚBLICOS
// ===================================================================
async function inicializarDados() {
    try {
        if (await Dica.countDocuments() === 0) {
            await Dica.insertMany([
                { id: 1, dica: "Verifique o nível do óleo regularmente. É como dar leitinho pro gatinho!", tipoVeiculo: "geral" },
                { id: 2, dica: "Calibre os pneus semanalmente para um passeio mais macio.", tipoVeiculo: "geral" },
                { id: 3, dica: "Confira o fluido de arrefecimento (a 'aguinha' do carro).", tipoVeiculo: "geral" },
                { id: 4, dica: "Mantenha os faróis e lanternas limpinhos para enxergar bem à noite.", tipoVeiculo: "geral" },
                { id: 10, dica: "Faça o rodízio dos pneus a cada 10.000 km para um desgaste uniforme.", tipoVeiculo: "carrobase" },
                { id: 11, dica: "Verifique o alinhamento e balanceamento se sentir o volante trepidar.", tipoVeiculo: "carrobase" },
                { id: 15, dica: "Use sempre combustível de alta octanagem para o motor render o máximo!", tipoVeiculo: "carroesportivo" },
                { id: 16, dica: "Fique de olho no desgaste dos freios, pois esportivos exigem mais deles.", tipoVeiculo: "carroesportivo" },
                { id: 20, dica: "Verifique o sistema de freios a ar com frequência, é sua maior segurança!", tipoVeiculo: "caminhao" },
                { id: 21, dica: "Lubrifique os pinos e articulações do chassi periodicamente.", tipoVeiculo: "caminhao" },
                { id: 30, dica: "Lubrifique e ajuste a tensão da corrente a cada 500 km.", tipoVeiculo: "moto" },
                { id: 31, dica: "Verifique sempre os dois freios (dianteiro e traseiro) antes de sair.", tipoVeiculo: "moto" }
            ]);
            console.log('Dicas de manutenção inseridas.');
        }

        if (await VeiculoDestaque.countDocuments() === 0) {
            await VeiculoDestaque.insertMany([
                { id: 10, modelo: "Carrinho de Laço da Kitty 1", ano: 2024, destaque: "Perfeito para passeios no parque!", imagemUrl: "https://i.pinimg.com/originals/a9/3c/66/a93c669165d38c2323e1e2c1c0a1a0e8.jpg" },
                { id: 11, modelo: "Mini Van de Piquenique", ano: 2023, destaque: "Leva todos os amiguinhos!", imagemUrl: "https://i.pinimg.com/736x/89/a3/93/89a39396489390234a9925232d326f5f.jpg" },
                { id: 12, modelo: "Conversível Estrelado", ano: 2025, destaque: "Brilha mais que o céu à noite!", imagemUrl: "https://i.pinimg.com/originals/30/1f/24/301f243a416a567636e78119a0cd881c.jpg" }
            ]);
            console.log('Veículos em destaque inseridos.');
        }

        if (await Servico.countDocuments() === 0) {
            await Servico.insertMany([
                { id: "svc001", nome: "Banho de Espuma com Brilho de Morango", descricao: "Deixa a pintura do seu carro cheirosa e brilhante.", precoEstimado: "R$ 150,00" },
                { id: "svc002", nome: "Alinhamento de Lacinhos e Balanceamento de Corações", descricao: "Para uma direção mais fofa e segura.", precoEstimado: "R$ 120,00" },
                { id: "svc003", nome: "Troca de Óleo Essencial de Baunilha", descricao: "Mantém o motor funcionando suave como um abraço.", precoEstimado: "R$ 200,00" },
                { id: "svc004", nome: "Check-up Fofura Completo", descricao: "Verificamos todos os itens fofos do seu veículo.", precoEstimado: "R$ 250,00" }
            ]);
            console.log('Serviços da garagem inseridos.');
        }
    } catch (error) {
        console.error('Erro ao inicializar dados:', error);
    }
}
mongoose.connection.once('open', inicializarDados);

// ===================================================================
//      4. ROTAS DE AUTENTICAÇÃO
// ===================================================================

app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) return res.status(400).json({ msg: 'Forneça e-mail e senha.' });
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) return res.status(400).json({ msg: 'Usuário com este e-mail já existe.' });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        user = new User({ email: email.toLowerCase(), password: hashedPassword });
        await user.save();
        res.status(201).json({ msg: 'Usuário registrado com sucesso!' });
    } catch (err) {
        res.status(500).send('Erro no servidor');
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) return res.status(400).json({ msg: 'Credenciais inválidas.' });
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({ msg: 'Credenciais inválidas.' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Credenciais inválidas.' });
        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        res.status(500).send('Erro no servidor');
    }
});

// ===================================================================
//      5. ROTAS PROTEGIDAS (PRECISAM DE LOGIN)
// ===================================================================

// ---> ROTA DE LISTAGEM ATUALIZADA <---
app.get('/api/garagem/veiculos', authMiddleware, async (req, res) => {
    try {
        const veiculos = await VeiculoGaragem.find({
            $or: [
                { owner: req.user.id },       // Veículos que eu possuo
                { sharedWith: req.user.id }  // Veículos compartilhados comigo
            ]
        }).populate('owner', 'email'); // Adiciona o email do dono para o frontend
        
        res.status(200).json(veiculos);
    } catch (error) {
        console.error("Erro ao buscar veículos:", error);
        res.status(500).json({ error: 'Erro ao buscar veículos' });
    }
});


app.post('/api/garagem/veiculos', authMiddleware, async (req, res) => {
    try {
        const dadosVeiculo = req.body;
        const novoVeiculo = new VeiculoGaragem({
            ...dadosVeiculo,
            _id: dadosVeiculo.id,
            owner: req.user.id
        });
        await novoVeiculo.save();
        res.status(201).json(novoVeiculo);
    } catch (error) {
        console.error("ERRO AO SALVAR VEÍCULO:", error);
        res.status(500).json({ error: 'Erro ao salvar novo veículo' });
    }
});

app.put('/api/garagem/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const veiculo = await VeiculoGaragem.findById(req.params.id);
        if (!veiculo) return res.status(404).json({ error: 'Veículo não encontrado.' });
        if (veiculo.owner.toString() !== req.user.id) return res.status(403).json({ error: 'Não autorizado. Você não é o dono.' });
        const veiculoAtualizado = await VeiculoGaragem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(veiculoAtualizado);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar veículo.' });
    }
});

app.delete('/api/garagem/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const veiculo = await VeiculoGaragem.findById(req.params.id);
        if (!veiculo) return res.status(404).json({ error: 'Veículo não encontrado.' });
        if (veiculo.owner.toString() !== req.user.id) return res.status(403).json({ error: 'Não autorizado. Você não é o dono.' });
        await VeiculoGaragem.findByIdAndDelete(req.params.id);
        await DetalhesExtras.findOneAndDelete({ veiculoId: req.params.id });
        res.status(200).json({ message: 'Veículo excluído com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir veículo.' });
    }
});

// ---> NOVA ROTA PARA COMPARTILHAMENTO <---
app.post('/api/garagem/veiculos/:id/share', authMiddleware, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ msg: 'Email para compartilhamento é obrigatório.' });

        const veiculo = await VeiculoGaragem.findById(req.params.id);
        if (!veiculo) return res.status(404).json({ msg: 'Veículo não encontrado.' });
        
        // Validação 1: O usuário logado é o dono do veículo?
        if (veiculo.owner.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Ação proibida. Você não é o dono deste veículo.' });
        }

        // Validação 2: O usuário com quem se quer compartilhar existe?
        const userToShareWith = await User.findOne({ email: email.toLowerCase() });
        if (!userToShareWith) {
            return res.status(404).json({ msg: `Usuário com o email "${email}" não encontrado.` });
        }
        
        // Validação 3: Não compartilhar consigo mesmo
        if(userToShareWith.id === req.user.id) {
            return res.status(400).json({ msg: 'Você não pode compartilhar um veículo consigo mesmo.'});
        }
        
        // Validação 4: Já não está compartilhado com este usuário?
        if(veiculo.sharedWith.includes(userToShareWith.id)) {
            return res.status(400).json({ msg: 'Este veículo já foi compartilhado com este usuário.'});
        }

        // Ação: Adiciona o ID ao array e salva
        veiculo.sharedWith.push(userToShareWith.id);
        await veiculo.save();

        res.json({ msg: `Veículo "${veiculo.modelo}" compartilhado com ${email} com sucesso!` });

    } catch (error) {
        console.error("Erro ao compartilhar veículo:", error);
        res.status(500).json({ error: 'Erro no servidor ao tentar compartilhar.' });
    }
});


app.get('/api/detalhes-extras/:veiculoId', authMiddleware, async (req, res) => {
    try {
        // Para detalhes, verificamos se o usuário é o dono OU se o veículo foi compartilhado com ele
        const veiculo = await VeiculoGaragem.findOne({
            _id: req.params.veiculoId,
            $or: [{ owner: req.user.id }, { sharedWith: req.user.id }]
        });

        if (!veiculo) return res.status(403).json({ error: 'Não autorizado a ver estes detalhes.' });
        
        const detalhes = await DetalhesExtras.findOne({ veiculoId: req.params.veiculoId });
        if (detalhes) res.json(detalhes);
        else res.status(404).json({ message: 'Nenhum detalhe extra encontrado.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar detalhes extras' });
    }
});

app.put('/api/detalhes-extras/:veiculoId', authMiddleware, async (req, res) => {
    try {
        // Apenas o dono pode editar detalhes extras
        const veiculo = await VeiculoGaragem.findOne({ _id: req.params.veiculoId, owner: req.user.id });
        if (!veiculo) return res.status(403).json({ error: 'Não autorizado a editar. Apenas o dono pode.' });

        const options = { new: true, upsert: true, setDefaultsOnInsert: true };
        const detalhes = await DetalhesExtras.findOneAndUpdate({ veiculoId: req.params.veiculoId }, req.body, options);
        res.json(detalhes);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar detalhes extras' });
    }
});


// ===================================================================
//      6. ROTAS PÚBLICAS
// ===================================================================

app.get('/api/garagem/veiculos-destaque', async (req, res) => {
    try {
        const veiculos = await VeiculoDestaque.find();
        res.json(veiculos);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar veículos em destaque' });
    }
});

app.get('/api/garagem/servicos-oferecidos', async (req, res) => {
    try {
        const servicos = await Servico.find();
        res.json(servicos);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar serviços oferecidos' });
    }
});

app.get('/api/dicas-manutencao', async (req, res) => {
    try {
        const { tipo } = req.query;
        let query = { tipoVeiculo: 'geral' }; 

        if (tipo && tipo !== 'geral') {
            query = { tipoVeiculo: { $in: [tipo, 'geral'] } };
        }
        
        const dicas = await Dica.find(query);
        res.json(dicas);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar dicas de manutenção' });
    }
});


app.get('/api/previsao/:cidade', async (req, res) => {
    const { cidade } = req.params;
    if (!apiKey || apiKey === "SUA_CHAVE_OPENWEATHERMAP_AQUI") {
        return res.status(500).json({ error: 'Chave da API não configurada no servidor.' });
    }
    const weatherAPIUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${cidade}&appid=${apiKey}&units=metric&lang=pt_br`;
    try {
        const apiResponse = await axios.get(weatherAPIUrl);
        res.json(apiResponse.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: 'Erro ao buscar dados do clima.' });
    }
});

// ===================================================================
//      7. INICIA O SERVIDOR
// ===================================================================

app.listen(port, () => {
    console.log(`Servidor fofinho rodando em http://localhost:${port}`);
    if (!process.env.JWT_SECRET) {
        console.warn("***************** ATENÇÃO: JWT_SECRET não configurado no .env! A segurança está comprometida. *****************");
    }
});