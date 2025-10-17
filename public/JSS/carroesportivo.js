class CarroEsportivo extends CarroBase {
    /**
     * Cria uma instância de CarroEsportivo.
     * Usa 'img/default_sport.png' como imagem padrão se nenhuma for fornecida.
     * @param {string} id - ID único.
     * @param {string} modelo - Modelo.
     * @param {string} cor - Cor.
     * @param {string} [img] - Imagem (path ou Base64).
     * @param {string} [placa] - Placa.
     * @param {number|string} [ano] - Ano.
     * @param {string|Date|null} [cnh] - Vencimento CNH.
     */
    constructor(id, modelo, cor, img, placa, ano, cnh) {
        super(id, modelo, cor, img || 'img/default_sport.png', placa, ano, cnh);
        /** @type {boolean} Estado do turbo (ligado/desligado). */
        this.turboAtivado = false;
    }

    /**
     * Alterna o estado do turbo (ligado/desligado), somente se o carro estiver ligado.
     * Atualiza a UI para refletir a mudança.
     * @returns {void}
     */
    ativarTurbo() {
        if (this.ligado) {
            this.turboAtivado = !this.turboAtivado;
            this.atualizarInformacoesUI("Turbo"); // Atualiza UI mostrando status ON/OFF.
        } else {
            this.notificarUsuario('Ligue o carro para ativar o turbo!');
        }
    }

    /**
     * Sobrescreve o método acelerar da classe base.
     * Acelera mais rapidamente, especialmente com turbo ativado.
     * Limite de velocidade maior (250 km/h).
     * @returns {void}
     */
    acelerar() {
        if (this.ligado) {
            const VELOCIDADE_MAXIMA_ESPORTIVO = 250;
            const incremento = this.turboAtivado ? 25 : 15; // Aceleração maior com turbo.
            this.velocidade = Math.min(this.velocidade + incremento, VELOCIDADE_MAXIMA_ESPORTIVO);
            this.tocarSom('som-acelerar');
            this.atualizarInformacoesUI("Acelerou");
        } else {
            this.notificarUsuario('Ligue o carro para acelerar!');
        }
    }
}