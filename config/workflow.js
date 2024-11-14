// var pontosControleSei = [
//     { "name": "ADM – Aguardando Análise", "value": 362 },
//     { "name": "ADM – Em Análise", "value": 363 },
//     { "name": "Aguardando Assinatura", "value": 366 },
//     { "name": "Aguardando Providências da SOR", "value": 367 },
//     { "name": "COO – Aguardando Análise", "value": 361 },
//     { "name": "EST – Aguardando Análise", "value": 364 },
//     { "name": "EST – Em Análise", "value": 365 },
//     { "name": "JUR – Aguardando Análise", "value": 356 },
//     { "name": "JUR – Em Análise", "value": 357 },
//     { "name": "JUR – Aguardando Avaliação", "value": 358 },
//     { "name": "JUR – Em Avaliação", "value": 359 },
//     { "name": "JUR – Em Correção de Análise", "value": 360 },
//     { "name": "RAD - Aguardando Análise", "value": 350 },
//     { "name": "RAD - Em Análise", "value": 351 },
//     { "name": "RAD - Aguardando Avaliação", "value": 352 },
//     { "name": "RAD - Em Avaliação", "value": 353 },
//     { "name": "RAD - Em Correção de Análise", "value": 355 },
//     { "name": "RAD - Análise GRs", "value": 371 },
//     { "name": "TEC - Aguardando Análise", "value": 344 },
//     { "name": "TEC - Em Análise", "value": 345 },
//     { "name": "TEC - Aguardando Avaliação", "value": 346 },
//     { "name": "TEC - Em Avaliação", "value": 347 },
//     { "name": "TEC - Em Correção de Análise", "value": 349 }];

var pontosControleSei;
var config;
var groups;
var commands = {
    atribuir: [{ desc: "Usuário", type: "any" }],
    marcar: [
        { desc: "Marcador", type: "text" },
        { desc: "Observação", type: "text" }
    ],
    desmarcar: [
        { desc: "Marcador", type: "text" }
    ],
    anotar: [
        { desc: "Nota", type: "text" }
    ],
    desanotar: [
        { desc: "Índice", type: "number" }
    ],
    concluir: []
};
var macros = ['@login', '@anterior', '@atribuidos', '@atribuiveis'];

var currentOperTarget, currentActionTarget, currentWfiTarget;
var operEditor, actionEditor, wfiEditor;


const iconePadrao = "next-flag";
const SPRITE = "../images/sprite.svg";

jQuery(async function ($) {
    $('#wfContainer, #actContainer, #operContainer').sortable({ handle: '.card-header' });

    waitMessage('Carregando...', { compact: true });

    $('.modal-over').on('show.bs.modal', event => {
        if ($(event.currentTarget).prev().is('.modal-backdrop')) return;

        $('.modal-backdrop').hide();
        $(event.currentTarget).before('<div class="modal-backdrop fade show"></div>');
    });

    $('.modal-over').on('hide.bs.modal', event => {
        if ($(event.currentTarget).prev().is('.modal-backdrop:visible')) {
            $(event.currentTarget).prev().remove();
            let $parent = $(event.currentTarget).parent('.modal');
            if (!$parent.prev().is('.modal-backdrop')) {
                $('.modal-backdrop').show();
            }
        } else if ($(event.currentTarget).prev().is('.modal-backdrop')) $(event.currentTarget).prev().show();

    });

    $('#selDestinoAcao option').remove();
    $('#selDestinoAcao').append(`<option value=""></option>`);

    $('#selCmdOper option').remove();
    for (let cmd in commands) {
        $('#selCmdOper').append(`<option>${cmd}</option>`);
    }

    let datalist = document.createElement("datalist");
    datalist.id = 'macros-list';

    for (let macro of macros) {
        let option = document.createElement("option");
        option.value = macro;
        datalist.appendChild(option);
    }
    $('#cmdOper').append(datalist);


    let sprite = new Request(SPRITE);
    fetch(sprite).then(response => response.text()).then(response => {
        let parser = new DOMParser();
        let xml = parser.parseFromString(response, "image/svg+xml");
        xml.querySelectorAll('.sprite').forEach(symbol => {
            let icon = document.createElement("img");
            icon.classList.add("icon-card");
            icon.classList.add("card");
            icon.setAttribute("src", `${SPRITE}#${symbol.id}`);
            icon.setAttribute("icone", `#${symbol.id}`);
            iconContainer.appendChild(icon);

            icon.addEventListener('click', e => selectIconeAcao(e.currentTarget.getAttribute("src")));
        });
    });

    // Botões de ação superior
    $('#btnBack').on('click', exitWorkflow);
    $('#btnClear').on('click', clearWorkflow);
    $('#btnAddToWorkflow').on('click', e => editWorkflowItem());
    $('#btnApplyWorkflow').on('click', applyWorkflow);
    $('#btnExport').on('click', confirmExport);
    $('#fileImport').on('change', e => loadConfigFile(e.currentTarget));
    $('#btnImport').on('click', importConfig);
    $('#btnInit').on('click', initWorkflowSkeleton);
    $('#btnMerge').on('click', mergeWorkflow);

    //Tela de edição de Ponto de Controle
    $('#selGrupo').on('change', e => changeGrupo(e.currentTarget));
    $('#btnAddAction').on('click', e => editActionItem());
    $('#btnStoreWfi').on('click', storeWorkflowItem);

    //Tela de edição de ação
    $('#btnStoreAction').on('click', storeAction);

    //Tela de edição de ação
    $('#btnStoreGrupo').on('click', e => storeGrupo(e.currentTarget));

    //Tela de edição de operação
    $('#btnStoreOper').on('click', storeOper);
    $('#selCmdOper').on('change', e => changeCmdOper(e.currentTarget));
    $('#btnAddRowVar').on('click', addRowVar);

    $(window).on('message', e => {
        let data = JSON.parse(e.originalEvent.data);
        pontosControleSei = data.pontosControle.map(item => Object({
            key: defineKey(item[1]),
            name: item[1],
            value: item[0]
        }));

        for (let ponto of pontosControleSei) {
            $('#selDestinoAcao').append(`<option value="${ponto.key}">${ponto.name}</option>`);
        }

        initWorkflow(data.config);
        waitMessage(null);
    });


});

function defineKey(value, camel = false) {
    value = value.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    value = value.replace(/\b(?:a|ante|ate|com|contra|d[aeo]|desde|para|p[eo]r])\b/g, "").replace(/\s+\W?\s+/g, " ");
    value = value.replace(/\W+/g, "_").toLowerCase();

    value = value.replace("aguardando", "ag");

    if (camel) value = value.replace(/^_+/g, "").replace(/_([a-z])/g, (m0, m1) => m1.toUpperCase());

    return value;
}

function initWorkflow(data) {
    clearWorkflow();

    if (!data) data = {
        version: "1",
        workflow: {},
        operations: {}
    };

    config = data;
    groups = new Set();

    if (config.workflow) {
        for (const [key, pc] of Object.entries(config.workflow)) {
            addWorkflowItem(key, pc);
            if (pc.group) groups.add(pc.group);
        }
    }

    $('#operList li').remove();
    if (config.operations) {
        for (const [key, oper] of Object.entries(config.operations)) {
            $('#operList').append(`<li><a class="dropdown-item" oper-name="${key}" href="#">${key}</a></li>`);
        }
    }

    if ($('#operList li').length) $('#operList').append('<li><hr class="dropdown-divider"></li>');
    $('#operList').append(`<li><a class="dropdown-item" href="#">Criar Nova...</a></li>`);

    $('#operList li a').on('click', e => e.currentTarget.getAttribute('oper-name') ? addOperItem(e.currentTarget.getAttribute('oper-name')) : editOperItem());
}

function mergeWorkflow(currentConfig, mergeConfig) {
    let mergedConfig = Object.assign({}, currentConfig);
    for (const [key, pontoControle] in mergeConfig) {
        if (!pontosControleSei.find(p => p.key == key)) continue;

        pontoControle.actions = (pontoControle.actions ?? []).filter(a => !(a.to) || pontosControleSei.find(p => p.key == a.to));

        for (let action of pontoControle.actions) {
            if (action.operations) {
                for (i = 0; i < action.operations.length; i++) {
                    let oper = action.operations[i];
                    let mergeOperName = oper;

                    if (mergedConfig.operations[oper]) {
                        mergeOperName = 'm-' + oper;
                        action.operations[i] = mergeOperName;
                    }

                    if (!mergedConfig.operations[mergeOperName]) mergedConfig.operations[mergeOperName] = mergeConfig.operations[oper];
                }
            }
        }

        if (mergedConfig.workflow[key]) {
            mergedConfig.workflow[key].actions = [...(mergedConfig.workflow[key].actions ?? []), ...pontoControle.actions];
            if (pontoControle.grupo) mergedConfig.workflow[key].grupo = pontoControle.grupo;
        } else mergedConfig.workflow[key] = pontoControle;
    }

}

function clearWorkflow() {
    $('#wfContainer li').remove();
    groups = [];
    config = null;
}

function applyWorkflow() {
    window.top.postMessage(JSON.stringify(config), '*');
}

function exitWorkflow() {
    window.top.postMessage("back", '*');
}


function initWorkflowSkeleton() {
    clearWorkflow();

    let skeleton = {
        workflow: {}
    };

    for (i = 0; i < pontosControleSei.length; i++) {
        let pontoControle = pontosControleSei[i];
        let nextPontoControle = pontosControleSei[i + 1] ?? null;
        let m, grupo = (m = pontoControle.name.match(/^\s*[(<[*#]?(.+?)\s*[.:_)>\]-]/)) && m[1];
        let nextGrupo = nextPontoControle && (m = nextPontoControle.name.match(/^\s*[(<[*#]?(.+?)\s*[.:_)>\]-]/)) && m[1];

        if (!grupo || grupo !== nextGrupo) {
            nextPontoControle = {
                label: 'Finalizar',
                icon: 'cancel-flag'
            };
        } else {
            nextPontoControle = {
                to: nextPontoControle.key,
                label: 'Avançar',
                icon: 'next-flag'
            };
        }

        skeleton.workflow[pontoControle.key] = {
            name: pontoControle.name,
            value: pontoControle.value,
            group: grupo ?? undefined,
            actions: [nextPontoControle]
        }
    }

    initWorkflow(skeleton);
    waitMessage(null);
}

function mergeWorkflow() {
    let input = document.getElementById('fileImport');
    input.mergeConfigFile = true;
    input.click();
}

function addWorkflowItem(key, item) {
    let $li = $(`
            <li class="card">
                <div class="card-header position-relative">
                    <span class="badge text-bg-secondary">#${key}</span>&nbsp; ${item.name}
                    <div class="panel-buttons position-absolute top-50 end-0 translate-middle-y">
                        <button class="panel-edit-button" title="Editar">&nbsp;</button>
                        <button class="panel-delete-button" title="Deletar">&nbsp;</button>
                        <button class="panel-expand-button collapsed" title="Detalhes" data-bs-toggle="collapse"
                            data-bs-target="#${key}_detail">&nbsp;</button>
                    </div>
                </div>

                <div id="${key}_detail" class="collapse">
                    <div class="card-body ">
                        <spam><code>Código: </code>${item.value}</spam><br>
                        <div data-id="actions"></div>
                    </div>
                </div>
            </li>
        `);

    updateWorkflowItem($li, item);

    $li.get(0).data = item;
    $('#wfContainer').append($li);

    $li.find('button.panel-edit-button').on('click', e => editWorkflowItem(e.currentTarget));
    $li.find('button.panel-delete-button').on('click', e => delWorkflowItem(e.currentTarget));
}

function updateWorkflowItem(target, data) {

    $(target).find('.card-body div[data-id="actions"] *').remove();

    let index = 0;
    let $actionsDiv = $(target).find('.card-body div[data-id="actions"]');

    for (const action of (data.actions ?? [])) {
        index++;
        $actionsDiv.append(`<span class="span-data"><code>Ação #${index}:</code>${action.label ? action.label : '[padrão]'}</span>`);
        $actionsDiv.append(`<span class="span-data"><code>Destino:</code>#${action.to ? action.to : '[nenhum]'}</span>`);

        if (action.operations && action.operations.length) {
            let $opers = $(`<span><code>Operações:</code></span>`);
            for (let oper of action.operations) $opers.append(`<span class="badge text-bg-secondary" oper-name="${oper}">${oper}</span>`)
            $actionsDiv.append($opers);
            $actionsDiv.append('<br>');
        }

    }

}

function changeGrupo(target) {
    if ($(target).val() == "new") {
        $('#txtNomeGrupo').val("");
        const editor = new bootstrap.Modal('#grpEditor');
        editor.show();
    }
}

function storeGrupo() {
    let grupo = $('#txtNomeGrupo').val();

    if (grupo && !groups.has(grupo)) {
        groups.add(grupo);
        $('#selGrupo option').last().before(`<option>${grupo}</option>`);
        $('#selGrupo').val(grupo);
    } else $('#selGrupo').val(grupo);
}

async function editWorkflowItem(target) {
    currentWfiTarget = target ? target.closest('li') : null;

    let data = currentWfiTarget && currentWfiTarget.data ? currentWfiTarget.data : {};

    if (!config) initWorkflow();
    let pontosRestantes = pontosControleSei.filter(ponto => (data.name == ponto.name) || config.workflow[defineKey(ponto.name)] == undefined);

    if (!pontosRestantes.length) return showError('Todos os pontos de controle já foram cadastrados');

    $('#selPontoControle option').remove();
    for (let ponto of pontosRestantes) {
        $('#selPontoControle').append(`<option value="${ponto.value}">${ponto.name}</option>`)
    }
    $('#selPontoControle').val(data.value);

    $('#selGrupo option').remove();
    $('#selGrupo').append(`<option></option>`);
    for (const grupo of groups) {
        $('#selGrupo').append(`<option>${grupo}</option>`);
    }
    $('#selGrupo').append(`<option value="new">Criar Novo..</option>`);
    $('#selGrupo').val(data.group);

    clearActionList();
    for (action of (data.actions ?? [])) {
        addActionItem(action);
    }

    if (!wfiEditor) wfiEditor = new bootstrap.Modal('#wfiEditor', {
        keyboard: false
    });

    wfiEditor.show();
}

function storeWorkflowItem() {
    let wfiItem = {
        name: $('#selPontoControle option:selected').text(),
        value: $('#selPontoControle').val(),
        group: $('#selGrupo').val()
    };

    let actions = $('#actContainer li').get().map(item => item.data);
    if (actions.length) wfiItem.actions = actions;

    let key = defineKey(wfiItem.name);

    config.workflow[key] = wfiItem;

    if (currentWfiTarget) {
        currentWfiTarget.data = wfiItem;
        updateWorkflowItem(currentWfiTarget, wfiItem);
    } else addWorkflowItem(key, wfiItem);

    wfiEditor.hide();
    currentWfiTarget = null;
}

function clearActionList() {
    $('#actContainer li').remove();
}

function addActionItem(action) {

    let icone = action.icon ?? iconePadrao;

    let $li = $(`						
    <li class="card">
        <div class="card-header"><img class="icon-action-item" src="${SPRITE}#${icone}">&nbsp;<span>${action.label}</span> 
            <div class="panel-buttons position-absolute top-50 end-0 translate-middle-y">
                <button class="panel-edit-button" title="Editar Ação">&nbsp;</button>
                <button class="panel-delete-button" title="Excluir Ação">&nbsp;</button>
            </div>
        </div>

    </li>`);

    $li.get(0).data = action;

    $('#actContainer').append($li);

    $li.find('button.panel-edit-button').on('click', e => editActionItem(e.currentTarget));
    $li.find('button.panel-delete-button').on('click', e => e.currentTarget.closest('li').remove());
}

async function editActionItem(target) {
    currentActionTarget = target ? target.closest('li') : null;
    let data = currentActionTarget && currentActionTarget.data ? currentActionTarget.data : {};

    $('#txtRotuloAcao').val(data.label ?? '').focus();

    selectIconeAcao(data.icon ?? iconePadrao);

    $('#selDestinoAcao').val(data.to ?? '');

    clearOperList();
    if (data.operations) {
        for (let oper of data.operations) addOperItem(oper);
    }

    if (!actionEditor) actionEditor = new bootstrap.Modal('#actEditor', {
        keyboard: false,
        backdrop: false
    });

    $('#actEditorLabel').text(currentActionTarget ? "Editar Ação" : "Nova Ação");


    actionEditor.show();
}

function selectIconeAcao(icone) {
    $('.icon-card.selected').removeClass('selected');

    icone = icone.replace(/^.*#/, '')

    $(`[icone="#${icone}"]`).closest('.icon-card').addClass('selected');

    document.getElementById('selIconeAcao').setAttribute("src", SPRITE + "#" + icone);
}

function storeAction() {

    let newAction = {
        to: $('#selDestinoAcao').val(),
        label: $('#txtRotuloAcao').val()
    };

    let operations = $('#operContainer li').get().map(item => $(item).find('span').text());
    if (operations.length) newAction.operations = operations;

    let icone = document.getElementById('selIconeAcao').getAttribute("src");
    newAction.icon = icone.replace(/^.*#/, '');

    if (currentActionTarget) {
        currentActionTarget.data = newAction;
        currentActionTarget.querySelector('span').textContent = newAction.label;
        currentActionTarget.querySelector('img').setAttribute("src", SPRITE + '#' + newAction.icon);
    } else addActionItem(newAction);

    actionEditor.hide();
    currentActionTarget = null;
}

function clearOperList() {
    $('#operContainer li').remove();
}

function addOperItem(oper) {
    let operName = oper;
    oper = config.operations[operName] ?? {};

    let $li = $(`						
    <li class="card" oper-name="${operName}">
        <div class="card-header"><span>${operName}</span><br><code>${oper.run}</code>
            <div class="panel-buttons position-absolute top-50 end-0 translate-middle-y">
                <button class="panel-edit-button" title="Editar Operação">&nbsp;</button>
                <button class="panel-delete-button" title="Excluir Operação">&nbsp;</button>
            </div>
        </div>

    </li>`);

    $li.get(0).data = oper;

    $('#operContainer').append($li);

    $li.find('button.panel-edit-button').on('click', e => editOperItem(e.currentTarget));
    $li.find('button.panel-delete-button').on('click', e => e.currentTarget.closest('li').remove());

}

function updateOperItem(target, name, oper) {
    $(target).attr('oper-name', name);
    $(target).find('span').text(name);
    $(target).find('code').text(oper.run);
    target.data = oper;
}

function editOperItem(target) {
    currentOperTarget = target ? target.closest('li') : null;

    let name = currentOperTarget ? $(currentOperTarget).attr('oper-name') : '';
    let oper = currentOperTarget && currentOperTarget.data ? currentOperTarget.data : {};

    $('#txtNomeOper').val(name);

    $('#selCmdOper').val("");

    let m = (oper.run ?? "").match(/(\w+)\(\s*(['"][^'"]*['"]|\-?\d+)?(?:\s*,\s*(['"][^'"]*['"]|\d+))?\s*\)/);
    if (m) {
        $('#selCmdOper').val(m[1]).trigger("change");
        $('.cmd-args').each((index, item) => {
            let value = m[index + 2] ?? '';
            $(item).val(value.replace(/['"]/g, ''));
        });
    }

    $('#cmdVars tbody tr').remove();
    for (const [k, v] of Object.entries(oper.vars ?? {})) addVarItem(k, v);

    if (!operEditor) operEditor = new bootstrap.Modal('#operEditor', {
        keyboard: false,
        backdrop: false
    });

    operEditor.show();
}

function storeOper() {
    let name = $('#txtNomeOper').val().trim();

    if (!name) throw new Error('Campo obrigatório');

    let cmd = $('#selCmdOper').val();
    let args = "";
    $('.cmd-args').each((index, item) => {
        args += args ? ', ' : '';
        let val = $(item).val().trim();

        if (commands[cmd].type == 'text') args += "'" + val + "'";
        else if (commands[cmd].type == 'number') args += val;
        else args += val ? (isNaN(val) ? "'" + val + "'" : val) : '';
    });

    const keys = ['type', 'label', 'options'];

    let vars = $('#cmdVars tbody tr').get().map(row => {
        let cols = $(row).find('td').get().map(col => $(col).text());
        let key = cols.shift() ?? "";
        cols.pop();

        cols = cols.map((item, index) => [keys[index], item]);
        return [key.replace(/\W/g, ''), Object.fromEntries(cols)];
    });

    let oldName = currentOperTarget && $(currentOperTarget).attr('oper-name');


    let oper = config.operations[oldName] ?? {};
    oper.run = cmd + '(' + args + ')';
    oper.vars = Object.fromEntries(vars);

    config.operations[name] = oper;

    if (currentOperTarget) {
        $(`li[oper-name=${oldName}]`).each((index, item) => updateOperItem(item, name, oper));

        if (oldName !== name) {
            delete config.operations[oldName];
            $(`.dropdown-item[oper-name=${oldName}]`).attr('oper-name', name).text(name);
            for (let wfi of Object.values(config.workflow)) {
                for (let action of (wfi.actions ?? [])) {
                    if (action.operations) {
                        action.operations.forEach((item, index) => {
                            if (item == oldName) action.operations[index] = name;
                        });
                    }
                }
            }
        }
    } else {
        let $li = $(`<li><a class="dropdown-item" oper-name="${name}" href="#">${name}</a></li>`);
        $li.find('a').on('click', e => addOperItem(e.currentTarget.getAttribute('oper-name')));
        let $last = $('#operList [oper-name]').last();
        if (!$last.length) {
            $('#operList').prepend('<li><hr class="dropdown-divider"></li>');
            $('#operList').prepend($li);
        } else $last.after($li);

        addOperItem(name);
    }

    operEditor.hide();
    currentOperTarget = null;
}


function addVarItem(k, v) {
    let $tr = $(`
        <tr class="tr-delete-control">
            <td><span data-editable="${k}">${k}</span></td>
            <td><span data-editable="${v.type ?? ''}" data-selectable="text,number,select,textarea">${v.type ?? ''}</span></td>
            <td><span data-editable="${v.label ?? ''}">${v.label ?? ''}</span></td>
            <td><span data-editable="${v.options ?? ''}">${v.options ?? ''}</span></td>
            <td><div class="panel-buttons">
                <button class="panel-delete-button" title="Excluir Variável">&nbsp;</button>
            </div></td>
        </tr>
    `);

    $('#cmdVars tbody').append($tr);

    $tr.find('.panel-delete-button').on('click', e => delRowVar(e.currentTarget));

    $tr.find('[data-editable]').each((index, item) => {
        item.closest('td').addEventListener('click', () => { $(item).trigger('click') });

        item.addEventListener('click', function () {
            let input;
            if (item.dataset.selectable) {
                input = document.createElement('select');
                let options = item.dataset.selectable.split(",");
                for (const opt of options) {
                    let option = document.createElement('option');
                    option.text = opt;
                    input.appendChild(option);
                }

                input.addEventListener('change', () => input.blur());

            } else input = document.createElement('input');
            input.className = item.className;
            input.dataset.editableInput = true;
            input.value = item.dataset.editable;
            input.spellcheck = false;
            input.addEventListener('blur', () => {
                if (input.value) {
                    item.dataset.editable = input.value;
                    item.textContent = input.value;
                }
                input.replaceWith(item);
            })
            input.addEventListener('keydown', e => {
                if (e.key == 'Enter') {
                    e.preventDefault();
                    input.blur();
                }
            })
            item.replaceWith(input);
            input.focus();
            input.select();
        })
    });

    return $tr.get(0);
}

function changeCmdOper(target) {
    let cmd = commands[$(target).val()];

    $('#cmdOper div:gt(0)').remove();
    if (cmd) {
        for (let arg of cmd) {
            $('#cmdOper').append(`
                <div class="col">
                    <label class="form-label col">${arg.desc}</label>
                    <input type="text" list="macros-list" class="form-control cmd-args">
                </div>
            `);
        }
    }
}

function addRowVar() {
    let tr = addVarItem('', {});
    $(tr).find('td').first().trigger('click');
}

function delRowVar(target) {
    target.closest('tr').remove();
}

function delWorkflowItem(target) {
    target = target.closest('li');
    let key = defineKey(target.data.name);

    delete config.workflow[key];
    target.remove();
}

function download(file, text) {
    let element = document.createElement('a');
    element.setAttribute('href',
        'data:text/plain;charset=utf-8, '
        + encodeURIComponent(text));
    element.setAttribute('download', file);
    document.body.appendChild(element);
    element.click();

    document.body.removeChild(element);
}

function confirmExport() {
    const confirm = new bootstrap.Modal('#confirmExport');
    $('#txtConfigFilename').val('config');
    $('#btnConfirmExport').off('click.confirmExport').on('click.confirmExport', exportConfig);
    confirm.show();
}

function exportConfig() {
    let text = JSON.stringify(config, null, "  ");
    let filename = $('#txtConfigFilename').val() ?? "";
    filename = filename.trim();
    filename = filename ? filename : "config.json";

    if (!filename.endsWith(".json")) filename += '.json';

    download(filename, text);
}

function importConfig() {
    let input = document.getElementById('fileImport');
    input.mergeConfigFile = false;
    input.click();
}

function loadConfigFile(e) {
    let fr = new FileReader();
    fr.onload = function () {
        let data = JSON.parse(fr.result);
        if (e.mergeConfigFile) data = mergeWorkflow(config, data);
        initWorkflow(data);
    }

    fr.readAsText(e.files[0]);
    e.value = "";
}

function showError(msg) {
    const erroModal = new bootstrap.Modal('#errorModal', {
        backdrop: false
    });

    $('#errorModal .modal-body').text(msg);


    erroModal.show();
}
