class Caminhao extends CarroBase {
    /**
     * Cria uma instância de Caminhao.
     * Usa 'default_truck.png' como imagem padrão.
     * @param {string} id - ID único.
     * @param {string} modelo - Modelo.
     * @param {string} cor - Cor.
     * @param {string} [img] - Imagem (path ou Base64).
     * @param {string} [placa] - Placa.
     * @param {number|string} [ano] - Ano.
     * @param {string|Date|null} [cnh] - Vencimento CNH.
     * @param {number|string} [capCarga=0] - Capacidade máxima de carga em kg.
     */
    constructor(id, modelo, cor, img, placa, ano, cnh, capCarga = 0) {
        super(id, modelo, cor, img || 'default_truck.png', placa, ano, cnh);
        /** @type {number} Capacidade máxima de carga em kg. */
        this.capacidadeCarga = parseInt(capCarga) || 0;
        /** @type {number} Carga atual em kg. */
        this.cargaAtual = 0;
    }

    /**
     * Adiciona peso à carga atual do caminhão, se não exceder a capacidade máxima.
     * Atualiza a UI.
     * @param {number|string} peso - O peso (em kg) a ser adicionado.
     * @returns {void}
     */
    carregar(peso) {
        const numPeso = parseInt(peso);
        if (isNaN(numPeso) || numPeso <= 0) {
            this.notificarUsuario("Peso inválido para carregar. Use um número positivo.");
            return;
        }
        if (this.cargaAtual + numPeso <= this.capacidadeCarga) {
            this.cargaAtual += numPeso;
            this.atualizarInformacoesUI("Carregou"); // Atualiza UI com nova carga.
        } else {
            this.notificarUsuario(`Não pode carregar ${numPeso}kg. Capacidade (${this.capacidadeCarga}kg) excedida!`);
        }
    }

    /**
     * Sobrescreve o método acelerar.
     * A aceleração é reduzida com base na carga atual (quanto mais pesado, mais lento acelera).
     * Limite de velocidade menor (140 km/h).
     * @returns {void}
     */
    acelerar() {
        if (this.ligado) {
            const VELOCIDADE_MAXIMA_CAMINHAO = 140;
            // Fator de Carga: 1.0 (vazio) a ~0.33 (cheio). Afeta a aceleração.
            // `|| 1` previne divisão por zero se capacidade for 0.
            // `* 1.5` no denominador evita que o fator chegue a zero ou negativo.
            const fatorCarga = 1 - (this.cargaAtual / (this.capacidadeCarga * 1.5 || 1));
            // Aceleração base (ex: 8) é multiplicada pelo fator. Mínimo de 1 para sempre acelerar algo.
            const incremento = Math.max(1, Math.round(8 * fatorCarga));
            this.velocidade = Math.min(this.velocidade + incremento, VELOCIDADE_MAXIMA_CAMINHAO);
            this.tocarSom('som-acelerar');
            this.atualizarInformacoesUI("Acelerou");
        } else {
            this.notificarUsuario('Ligue o caminhão para acelerar!');
        }
    }
}