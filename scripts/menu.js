/**
* @file Script de interação com as paginas do SEI para criar opções adicionais no menu principal
* @author Fábio Fernandes Bezerra
* @copyright f2bezerra 2024
* @license MIT
*/

(async function init() {

	await waitDocumentReady(document);
	if (!document.getElementById('workflowAdmin')) {
		let anchorPontosControle = document.querySelector('a[link="controle_unidade_gerar"]');

		if (anchorPontosControle) {
			anchorPontosControle.style.background = '';

			let anchorMenuItem = anchorPontosControle.cloneNode(true);
			anchorMenuItem.setAttribute('link', 'pontos_controle_menu');
			anchorMenuItem.setAttribute('title', 'Opções de uso dos Pontos de Controle');
			anchorMenuItem.setAttribute('data-toggle', 'collapse');
			anchorMenuItem.setAttribute('role', 'button');
			anchorMenuItem.setAttribute('href', '#submenu_pontos_controle_admin');
			anchorMenuItem.setAttribute('aria-expanded', 'false');
			anchorMenuItem.setAttribute('aria-controls', 'collapseMenu');
			anchorMenuItem.className = "infraAnchorMenu";

			let seta = document.createElement('img');
			seta.setAttribute('src', "/infra_css/imagens/menu_seta.png");
			seta.className = "infraImgSetaMenu";
			seta.style.width = "12px";

			anchorMenuItem.appendChild(seta);

			let submenu = document.createElement('ul');
			submenu.id = "submenu_pontos_controle_admin";
			submenu.classList.add('collapse');

			anchorPontosControle.insertAdjacentElement('afterend', submenu);
			anchorPontosControle.insertAdjacentElement('afterend', anchorMenuItem);
			submenu.appendChild(anchorPontosControle);

			anchorPontosControle.querySelector('img').remove();
			anchorPontosControle.style.paddingLeft = "35px";
			anchorPontosControle.querySelector('span').textContent = "Lista de Processos";

			let anchorWorkflowAdmin = anchorPontosControle.cloneNode(true);
			anchorWorkflowAdmin.id = "workflowAdmin";
			anchorWorkflowAdmin.querySelector('span').textContent = "Fluxos de Trabalho";
			anchorWorkflowAdmin.setAttribute('href', '#');
			anchorMenuItem.setAttribute('title', 'Gerenciar Fluxos de Trabalho');
			submenu.appendChild(anchorWorkflowAdmin);

			anchorWorkflowAdmin.addEventListener('click', async e => {
				let list = await PontoControle.list(true);
				$('#divInfraAreaTelaD *').remove();
				$('#divInfraBarraLocalizacao').text('Gerenciamento de Fluxos de Trabalho');

				let $frame = $(`<iframe id="frmWorkflowAdmin" src="${browser.runtime.getURL('config/workflow.html')}" style="width: 100%;height:calc(100% - 100px);border:0;">`).on('load', e => {
					let data = {
						pontosControle: list,
						config: JSON.parse(localStorage.getItem('workflowConfig'))
					};
					e.currentTarget.contentWindow.postMessage(JSON.stringify(data), "*");
				});

				$(window).off('message', messageFromWorkflowAdmin).on('message', messageFromWorkflowAdmin);

				$('#divInfraAreaTelaD').append($frame);
			});
		}
	}

})();

function messageFromWorkflowAdmin(e) {
	if (e.originalEvent.data === "back") return window.top.document.location.reload();
	localStorage.setItem('workflowConfig', e.originalEvent.data);
	alert('Configuração aplicada com sucesso!');
	window.top.document.location.reload();
}
