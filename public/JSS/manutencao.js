class Manutencao {
    /**
     * Cria uma instância de Manutencao.
     * @param {string|Date|null} d - A data/hora da manutenção (string ISO 8601 ou objeto Date). Datas inválidas resultam em null.
     * @param {string} t - O tipo de serviço realizado (ex: "Troca de óleo"). Obrigatório.
     * @param {number|string} [c=0] - O custo do serviço. Padrão é 0.
     * @param {string} [desc=''] - Descrição ou observações adicionais. Opcional.
     */
    constructor(d, t, c, desc = '') {
        // Converte entrada para objeto Date, tratando casos nulos ou inválidos.
        this.data = d instanceof Date ? d : (d ? new Date(d) : null);
        if (this.data && isNaN(this.data.getTime())) {
            this.data = null;
        }
        this.tipo = String(t || '').trim(); // Garante que tipo seja string e remove espaços extras.
        this.custo = parseFloat(c) || 0; // Converte custo para número.
        this.descricao = String(desc || '').trim();
    }

    /**
     * Formata a manutenção para exibição como histórico (sem hora).
     * @returns {string} Descrição formatada da manutenção (ex: "Troca de óleo em 20/10/2023 - R$ 150,00").
     */
    formatar() {
        if (!this.data) return "Manutenção com data inválida";
        // Formata data para pt-BR (sem hora), usando UTC para consistência na exibição da data apenas.
        const dFmt = this.data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        const cFmt = this.custo > 0 ? ` - R$ ${this.custo.toFixed(2)}` : ""; // Adiciona custo se houver.
        return `${this.tipo || '(Tipo não informado)'} em ${dFmt}${cFmt}${this.descricao ? ` (${this.descricao})` : ''}`;
    }

    /**
     * Formata a manutenção para exibição como agendamento futuro (com hora).
     * @returns {string} Descrição formatada do agendamento (ex: "Revisão agendado p/ 25/12/2024, 14:30 - Custo Est.: R$ 300,00").
     */
    formatarComHora() {
        if (!this.data) return "Agendamento com data inválida";
        // Formata data e hora para pt-BR (considerando fuso horário local para agendamentos).
        const dHFmt = this.data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const cFmt = this.custo > 0 ? ` - Custo Est.: R$ ${this.custo.toFixed(2)}` : "";
        return `${this.tipo || '(Tipo não informado)'} agendado p/ ${dHFmt}${cFmt}${this.descricao ? ` (Obs: ${this.descricao})` : ''}`;
    }

    /**
     * Valida se os dados essenciais da manutenção são válidos (data e tipo).
     * @returns {boolean} `true` se a data é um objeto Date válido e o tipo é uma string não vazia.
     */
    validar() {
        return this.data instanceof Date && !isNaN(this.data.getTime()) &&
               typeof this.tipo === 'string' && this.tipo !== '' &&
               typeof this.custo === 'number' && this.custo >= 0;
    }

    /**
     * Converte a instância de Manutencao em um objeto simples para serialização JSON.
     * Essencial para salvar no LocalStorage. A data é convertida para ISO string.
     * @returns {object|null} Objeto serializável ou `null` se a data for inválida.
     */
    toJSON() {
        // Retorna null se a data for inválida para não salvar dados inconsistentes.
        return !this.data ? null : {
            data: this.data.toISOString(), // Formato padrão para intercâmbio de datas.
            tipo: this.tipo,
            custo: this.custo,
            descricao: this.descricao
        };
    }
}