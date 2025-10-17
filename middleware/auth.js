// middleware/auth.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export default function(req, res, next) {
    // Pega o token do cabeçalho "Authorization"
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'Nenhum token, autorização negada' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verifica se o token é válido
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user; // Adiciona o payload do usuário (que tem o ID) na requisição
        next(); // Passa para a próxima etapa da rota
    } catch (err) {
        res.status(401).json({ msg: 'Token não é válido' });
    }
}