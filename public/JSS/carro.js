// ==================================================
//      CLASSE BASE: CarroBase
// ==================================================
class CarroBase {
    /**
     * @param {string} id - ID único do veículo.
     * @param {string} modelo - Modelo do veículo.
     * @param {string} [cor=''] - Cor do veículo.
     * @param {string|null} [imagemSrc='img/default_car.png'] - Caminho ou Base64 da imagem.
     * @param {string} [placa=''] - Placa do veículo.
     * @param {number|string|null} [ano=null] - Ano de fabricação.
     * @param {string|Date|null} [dataVencimentoCNH=null] - Data de vencimento da CNH associada.
     */
    constructor(id, modelo, cor = '', imagemSrc = 'img/default_car.png', placa = '', ano = null, dataVencimentoCNH = null) {
        if (!id || !modelo) throw new Error("ID e Modelo são obrigatórios para criar um veículo.");
        this.id = String(id);
        this.modelo = String(modelo);
        this.cor = String(cor);
        this.imagemSrc = imagemSrc || 'img/default_car.png'; // Garante uma imagem padrão
        this.placa = String(placa).toUpperCase();
        this.ano = ano ? parseInt(ano) : null;

        // Tratamento da Data de Vencimento da CNH
        if (dataVencimentoCNH instanceof Date && !isNaN(dataVencimentoCNH)) {
            this.dataVencimentoCNH = dataVencimentoCNH;
        } else if (typeof dataVencimentoCNH === 'string' && dataVencimentoCNH.trim() !== '') {
            // Tenta converter string YYYY-MM-DD para Date (UTC para evitar problemas de fuso na data apenas)
            const dateObj = new Date(dataVencimentoCNH + 'T00:00:00Z');
            this.dataVencimentoCNH = !isNaN(dateObj.getTime()) ? dateObj : null;
        } else {
            this.dataVencimentoCNH = null;
        }

        this.ligado = false;
        this.velocidade = 0;
        /** @type {Manutencao[]} Histórico de manutenções. */
        this.historicoManutencao = [];
        this.tipoVeiculo = this.constructor.name; // 'CarroBase', 'CarroEsportivo', 'Caminhao'
    }

    // --- Métodos de Interação ---
    ligar() {
        if (!this.ligado) {
            this.ligado = true;
            this.tocarSom('som-ligar'); // Assumindo que tocarSom existe globalmente ou é injetado
            this.atualizarInformacoesUI("Ligou");
        } else {
            this.notificarUsuario("O carro já está ligado.");
        }
    }

    desligar() {
        if (this.ligado) {
            if (this.velocidade === 0) {
                this.ligado = false;
                this.tocarSom('som-desligar');
                this.atualizarInformacoesUI("Desligou");
            } else {
                this.notificarUsuario("Pare o carro antes de desligar!");
            }
        } else {
            this.notificarUsuario("O carro já está desligado.");
        }
    }

    acelerar() {
        if (this.ligado) {
            const VELOCIDADE_MAXIMA_BASE = 180;
            this.velocidade = Math.min(this.velocidade + 10, VELOCIDADE_MAXIMA_BASE);
            this.tocarSom('som-acelerar');
            this.atualizarInformacoesUI("Acelerou");
        } else {
            this.notificarUsuario('Ligue o carro para acelerar!');
        }
    }

    frear() {
        if (this.velocidade > 0) {
            this.velocidade = Math.max(0, this.velocidade - 15);
            this.tocarSom('som-frear');
            this.atualizarInformacoesUI("Freou");
        }
    }

    buzinar() {
        this.tocarSom('som-buzina');
        this.notificarUsuario(`${this.modelo} buzinou! (som não implementado)`); // Placeholder
    }

    // --- Gerenciamento de Manutenção ---
    /**
     * Adiciona uma manutenção ao histórico e salva.
     * @param {Manutencao} manutencao - Objeto Manutencao.
     * @returns {boolean} True se adicionado e salvo com sucesso, false caso contrário.
     */
    adicionarManutencao(manutencao) {
        if (manutencao instanceof Manutencao && manutencao.validar()) {
            this.historicoManutencao.push(manutencao);
            // Ordena manutenções por data (mais recentes primeiro)
            this.historicoManutencao.sort((a, b) => (b.data?.getTime() || 0) - (a.data?.getTime() || 0));

            if (typeof salvarGaragem === 'function' && salvarGaragem()) { // Tenta salvar globalmente
                this.atualizarInformacoesUI("Manutenção Adicionada");
                if (typeof atualizarExibicaoAgendamentosFuturos === 'function') atualizarExibicaoAgendamentosFuturos();
                if (typeof verificarAgendamentosProximos === 'function') verificarAgendamentosProximos();
                return true;
            } else {
                // Se salvarGaragem falhar, remove a manutenção adicionada para manter consistência
                this.historicoManutencao.pop(); // Assume que foi a última adicionada
                this.notificarUsuario("Erro ao salvar a garagem após adicionar manutenção. Alteração desfeita.");
                return false;
            }
        } else {
            this.notificarUsuario("Dados de manutenção inválidos.");
            return false;
        }
    }

    limparHistoricoManutencao() {
        this.historicoManutencao = [];
        if (typeof salvarGaragem === 'function' && salvarGaragem()) {
            this.atualizarInformacoesUI("Histórico Limpo");
             if (typeof atualizarExibicaoAgendamentosFuturos === 'function') atualizarExibicaoAgendamentosFuturos();
             if (typeof verificarAgendamentosProximos === 'function') verificarAgendamentosProximos();
        } else {
            this.notificarUsuario("Erro ao salvar a garagem após limpar histórico. Tente recarregar a página.");
            // Não há como "desfazer" a limpeza em memória facilmente se o save falhar.
        }
    }

    // --- Atualização da UI e Persistência ---
    /**
     * Atualiza os elementos da interface relacionados a este veículo.
     * @param {string} [origemAcao="Ação"] - Descrição da ação que trigou a atualização.
     */
    atualizarInformacoesUI(origemAcao = "Ação") {
        console.log(`UI Update para ${this.id} (${this.modelo}) devido a: ${origemAcao}`);
        const displayArea = document.getElementById('veiculo-display-area');
        // Verifica se o template deste veículo é o que está sendo exibido
        if (!displayArea || displayArea.dataset.veiculoId !== this.id) {
            // console.warn(`Tentativa de atualizar UI para ${this.id}, mas não está visível.`);
            return; // Não atualiza se não for o veículo ativo
        }

        const container = displayArea.querySelector(`.veiculo-renderizado[data-template-id]`);
        if (!container) {
            // console.warn(`Container do template para ${this.id} não encontrado na UI.`);
            return;
        }

        // Título (pode ter sido movido para fora da coluna)
        const tituloEl = container.querySelector('.veiculo-titulo') || displayArea.querySelector('.veiculo-titulo');
        if (tituloEl) tituloEl.textContent = `${this.modelo} (${this.tipoVeiculo})`;


        // Imagem
        const imgEl = container.querySelector('.veiculo-imagem');
        if (imgEl) {
            imgEl.src = this.imagemSrc || (this instanceof Caminhao ? 'default_truck.png' : (this instanceof CarroEsportivo ? 'img/default_sport.png' : 'img/default_car.png'));
            imgEl.alt = `Imagem de ${this.modelo}`;
        }

        // Status e Velocidade
        const statusEl = container.querySelector('.veiculo-status');
        if (statusEl) {
            statusEl.textContent = this.ligado ? 'Ligado' : 'Desligado';
            statusEl.className = `veiculo-status status-${this.ligado ? 'ligado' : 'desligado'}`;
        }
        container.querySelector('.veiculo-velocidade').textContent = this.velocidade;

        // Placa e Ano
        container.querySelector('.veiculo-placa').textContent = this.placa || '-';
        container.querySelector('.veiculo-ano').textContent = this.ano || '-';

        // Informações de CNH
        const cnhInfoEl = container.querySelector('.veiculo-cnh-info');
        if (cnhInfoEl) {
            let cnhHtml = '<span class="info-label">CNH Venc.:</span> ';
            if (this.dataVencimentoCNH instanceof Date && !isNaN(this.dataVencimentoCNH)) {
                const dataFormatada = this.dataVencimentoCNH.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                const hoje = new Date(); hoje.setHours(0,0,0,0);
                const vencimento = new Date(this.dataVencimentoCNH); vencimento.setHours(0,0,0,0); // Normaliza para UTC ao comparar
                let statusClasse = '';
                if (vencimento < hoje) {
                    statusClasse = 'cnh-vencida';
                    cnhHtml += `<span class="cnh-status ${statusClasse}">VENCIDA (${dataFormatada})</span>`;
                } else {
                    const diffTime = vencimento.getTime() - hoje.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays <= 30) {
                        statusClasse = 'cnh-vence-breve';
                        cnhHtml += `<span class="cnh-status ${statusClasse}">Vence em ${diffDays}d (${dataFormatada})</span>`;
                    } else {
                        cnhHtml += `<span class="cnh-status">${dataFormatada}</span>`;
                    }
                }
            } else {
                cnhHtml += '<span class="cnh-status">-</span>';
            }
            cnhInfoEl.innerHTML = cnhHtml;
        }


        // Informação Extra (Turbo/Carga)
        const extraInfoEl = container.querySelector('.veiculo-info-extra');
        if (extraInfoEl) {
            if (this instanceof CarroEsportivo) {
                extraInfoEl.innerHTML = `<span class="info-label">Turbo:</span> ${this.turboAtivado ? 'ATIVADO <i class="fa-solid fa-bolt" style="color: #f1c40f;"></i>' : 'Desativado'}`;
                const btnTurbo = container.querySelector('.acoes-veiculo button[data-acao="ativarTurbo"]');
                if (btnTurbo) {
                    btnTurbo.innerHTML = this.turboAtivado ? '<i class="fa-solid fa-ban"></i> Desativar Turbo' : '<i class="fa-solid fa-bolt"></i> Ativar Turbo';
                    btnTurbo.title = this.turboAtivado ? "Desativar Turbo" : "Ativar Turbo";
                }
            } else if (this instanceof Caminhao) {
                extraInfoEl.innerHTML = `<span class="info-label">Carga:</span> ${this.cargaAtual}kg / ${this.capacidadeCarga}kg`;
            } else {
                extraInfoEl.innerHTML = ''; // Limpa para CarroBase
            }
        }

        // Velocímetro e Barra de Aceleração
        const ponteiroEl = container.querySelector('.veiculo-ponteiro');
        const barraProgressoEl = container.querySelector('.veiculo-barra-progresso');
        if (ponteiroEl && barraProgressoEl) {
            let velMax = 180; // Padrão CarroBase
            if (this instanceof CarroEsportivo) velMax = 250;
            else if (this instanceof Caminhao) velMax = 140;

            const angulo = (this.velocidade / velMax) * 180 - 90; // Mapeia 0-velMax para -90 a 90 graus
            ponteiroEl.style.transform = `translateX(-50%) rotate(${Math.min(90, Math.max(-90, angulo))}deg)`;
            barraProgressoEl.style.width = `${(this.velocidade / velMax) * 100}%`;
        }


        // Campos de Edição (preenche com valores atuais)
        const formEdicao = container.querySelector('.edicao-veiculo');
        if (formEdicao) {
            formEdicao.querySelector('.edit-modelo-veiculo').value = this.modelo || '';
            formEdicao.querySelector('.edit-cor-veiculo').value = this.cor || '';
            formEdicao.querySelector('.edit-placa-veiculo').value = this.placa || '';
            formEdicao.querySelector('.edit-ano-veiculo').value = this.ano || '';
            // Formata Date para YYYY-MM-DD para o input type="date"
            formEdicao.querySelector('.edit-cnh-veiculo').value = this.dataVencimentoCNH instanceof Date ?
                this.dataVencimentoCNH.toISOString().split('T')[0] : '';

            // Limpa preview de imagem da edição
            const editImgPreview = formEdicao.querySelector('.edit-imagem-preview');
            if (editImgPreview) { editImgPreview.src = '#'; editImgPreview.style.display = 'none'; }
            const editImgInput = formEdicao.querySelector('.edit-imagem-input');
            if (editImgInput) editImgInput.value = ''; // Limpa o file input
        }

        // Histórico de Manutenção
        const listaHistEl = container.querySelector('.lista-historico');
        if (listaHistEl) {
            if (this.historicoManutencao.length > 0) {
                const itensHtml = this.historicoManutencao
                    .map(m => `<li>${m.formatar()}</li>`)
                    .join('');
                listaHistEl.innerHTML = `<ul>${itensHtml}</ul>`;
            } else {
                listaHistEl.innerHTML = '<p>Nenhum registro de manutenção encontrado.</p>';
            }
        }

        // Limpar área de detalhes da API simulada ao atualizar UI principal
        // Isso força o usuário a clicar novamente para buscar, garantindo dados "frescos" (embora simulados)
        const areaDetalhesExtras = container.querySelector('.detalhes-extras-area');
        if (areaDetalhesExtras) {
            areaDetalhesExtras.innerHTML = '<p>Clique no botão acima para buscar detalhes.</p>';
        }
    }


    /**
     * Converte a instância para um objeto JSON serializável.
     * Inclui o tipo de veículo para recriação correta.
     * @returns {object}
     */
    toJSON() {
        return {
            id: this.id,
            modelo: this.modelo,
            cor: this.cor,
            imagemSrc: this.imagemSrc, // Pode ser Base64 ou path
            placa: this.placa,
            ano: this.ano,
            dataVencimentoCNH: this.dataVencimentoCNH instanceof Date ? this.dataVencimentoCNH.toISOString() : null,
            ligado: this.ligado,
            velocidade: this.velocidade,
            historicoManutencao: this.historicoManutencao.map(m => m.toJSON()).filter(m => m !== null), // Salva apenas manutenções válidas
            tipoVeiculo: this.tipoVeiculo,

            // Propriedades específicas de subclasses (serão preenchidas por elas)
            ...(this instanceof CarroEsportivo && { turboAtivado: this.turboAtivado }),
            ...(this instanceof Caminhao && { capacidadeCarga: this.capacidadeCarga, cargaAtual: this.cargaAtual }),
        };
    }

    // --- Utilitários ---
    notificarUsuario(mensagem) {
        // Simples alerta por enquanto. Poderia ser um sistema de notificação mais sofisticado.
        console.log(`Notificação para ${this.modelo}: ${mensagem}`);
        alert(`${this.modelo}: ${mensagem}`);
    }

    tocarSom(somId) {
        // const som = document.getElementById(somId);
        // if (som) {
        //     som.currentTime = 0; // Reinicia o som
        //     som.play().catch(e => console.warn(`Não foi possível tocar ${somId}: ${e.name}`));
        // } else {
        //     console.warn(`Elemento de áudio com ID '${somId}' não encontrado.`);
        // }
        // console.log(`Tentativa de tocar som: ${somId} (funcionalidade de áudio removida para simplificar)`);
    }
}