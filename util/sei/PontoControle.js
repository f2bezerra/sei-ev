/**
* @file Classe de manipulação dos Pontos de Controle do SEI
* @author Fábio Fernandes Bezerra
* @copyright f2bezerra 2024
* @license MIT
*/

class PontoControle {
    /** 
     * @type String 
     */
    name;

    /**
     * Link para atualização do Ponto de Controle
     *
     * @type {String}
     */
    link;

    /**
     * Transição a ser executada em caso de confirmação
     *
     * @type {Array<ActionPontoControle>}
     */
    actions;


    constructor(name, link, actions) {
        this.name = name;
        this.link = link;
        this.actions = actions;
    }

    static fromName(name, link) {
        let config = this.#loadConfig();

        let pontoControle;

        if (pontoControle = (config && config.workflow && Object.values(config.workflow).find(pc => pc.name == name))) {

            for (let action of (pontoControle.actions ?? [])) {
                if (action.to) action.to = config.workflow[action.to] ?? action.to;
                if (action.operations) {
                    if (config.operations) action.operations = action.operations.map(oper => config.operations[oper]);
                    else action.operations = null;
                }
            }


            return new PontoControle(pontoControle.name, link, pontoControle.actions);
        }

        return null;
    }

    static keyFromName(name) {
        let key = name.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        key = key.replace(/\b(?:a|ante|ate|com|contra|d[aeo]|desde|para|p[eo]r])\b/g, "").replace(/\s+\W?\s+/g, " ");
        key = key.replace(/\W/g, "_").toLowerCase();
        key = key.replace("aguardando", "ag");
        return key;
    }

    static #loadConfig() {
        let config = localStorage.getItem('workflowConfig');
        if (!config) return null;

        config = JSON.parse(config);

        return config;
    }

    static async list(entries = false) {
        let pontosControle = sessionStorage.getItem('pontosControle');

        if (pontosControle) {
            pontosControle = JSON.parse(pontosControle);
            if (pontosControle[0] == entries) return pontosControle[1];
            if (pontosControle[0]) return pontosControle[1].map(item => item[1]);
        }

        let $anchor = $(window.top.document).find('a[href*="acao=controle_unidade_gerar"]');
        let source = await fetchData($anchor.attr('href'));

        if (!source) return [];

        if (entries) pontosControle = $(source).find('#selSituacao option').get().map(item => [$(item).val(), $(item).text()]).filter(item => item[0] != "null");
        else pontosControle = $(source).find('#selSituacao option').get().map(item => $(item).text()).filter(item => item != "Todos");

        sessionStorage.setItem('pontosControle', JSON.stringify([entries, pontosControle]));

        return pontosControle;
    }

    async executeAction(action, source, refresh) {
        if (!action) throw new Error('Transição não definida');

        if (action.operations) {
            let fields = [];
            let values = {};
            for (let oper of action.operations) {
                if (oper.vars) {
                    for (const [varId, varInfo] of Object.entries(oper.vars)) {
                        let field = {
                            id: varId,
                            label: varInfo.label ?? varId,
                            type: varInfo.type ? (varInfo.type == "number" ? "text" : varInfo.type) : "text",
                            rows: varInfo.type === "textarea" ? (isNaN(varInfo.options) ? 4 : Number(varInfo.options)) : undefined,
                            validation: varInfo.type === "number" ? /^\s*\+?\d+\s*$/ : undefined
                        };

                        switch (varInfo.type) {
                            case 'select':
                                field.items = varInfo.options ?? "";
                                if (field.items == "@atribuidos") {
                                    field.items = await this.#listAtribuidos();

                                    if (field.items) {
                                        field.items.shift();
                                        if (field.items.length) field.value = field.items[0];
                                    }
                                }
                                break;
                        }

                        fields.push(field);
                    }
                }
            }

            if (fields.length) {
                let title = action.label ?? 'sei-xp';
                title = title.split(" ");

                let confirmButton = action.label ? title[0] : 'Confirmar';

                title[0] = title[0].replace(/ar$/, 'ação');
                title = title.join(' ');

                values = await openFormDlg(fields, title, { width: "400px", confirmButton: confirmButton, alwaysResolve: true });

                if (!values) return;
            }

            let arg = a => {
                a = a ? a.trim() : "";
                if (a && !isNaN(a)) return Number(a);
                return a.replace(/(['"])?(.*)\1/, "$2").replace(/\$(\w+)\b/, (m0, k) => values[k] ?? "");
            };

            for (let oper of (action.operations ?? [])) {
                let run = (oper.run ?? "").match(/(\w+)\(\s*(['"][^'"]*['"]|\-?\d+)?(?:\s*,\s*(['"][^'"]*['"]|\d+))?\s*\)/);

                switch (run[1]) {
                    case 'atribuir':
                        let user = arg(run[2]);
                        if (user === undefined) user = null;
                        if (user === 0) user = undefined;
                        if (user === -1) user = this.#listAtribuidos[1] ?? "inexistente";

                        await this.#atribuir(user);
                        break;

                    case 'marcar':
                        await this.#setMarker(arg(run[2]), arg(run[3]));
                        break;

                    case 'desmarcar':
                        await this.#delMarker(arg(run[2]));
                        break;

                    case 'anotar':
                        await this.#setNota(arg(run[2]));
                        break;

                    case 'desanotar':
                        break;
                }
            }
        }

        await this.#set(action.to ? (action.to.value ?? action.to) : "null");

        if (refresh) window.top.document.location.reload();
    }

    async #setMarker(marker, value) {
        return setMarcador(marker, value);
    }

    async #delMarker(marker) {
        return delMarcador(marker);
    }

    async #setNota(value) {
        return addAnotacao(value);
    }

    async #atribuir(user) {
        return attribProcesso(user);
    }

    async #set(value) {
        if (!value) throw new Error("Ponto de Controle inválido");

        if (!isNaN(value)) value = Number(value);

        if (typeof value == "string" && value != "null") {
            let list = await PontoControle.list(true);

            let pontoControle = list.find(item => item[1] == value || PontoControle.keyFromName(item[1]) == value);
            if (!pontoControle) throw new Error(`Ponto de Controle '${value} 'não encontrado`);

            value = pontoControle[0];
        }

        value = value != "null" ? Number(value) : value;

        if (!this.link) {
            let docArvore = await waitDocumentReady("#ifrArvore");
            var pontoControle = getPontoControleInfo(docArvore);

            this.link = pontoControle.link;
        }

        return postFormData(this.link, { selSituacao: value });
    }

    async #listAtribuidos() {
        let atribuidos = await getHistorico({ descricao: /atribuído/i });

        if (atribuidos) {
            atribuidos = atribuidos.map(reg => (m = reg.descricao.match(/atribu[ií]do\s+para\s+(\w+)/i)) ? m[1] : '');
            atribuidos = [...new Set(atribuidos)];
        }

        return atribuidos ?? [];
    }

}

/**
 * @typedef {Object} ActionPontoControle - Configuração de ação para o POnto de Controle
 * @property {String} [to] - Ponto de Controle Destino
 * @property {String} label - Descrição da transição
 * @property {String} [icon] - Ícone representativo da transição
 * @property {Array<String>} [operations] - Operações que serão executadas antes de finalizar o ponto de controle
 *
 */



