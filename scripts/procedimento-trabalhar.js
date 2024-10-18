/**
* @file Script de interação com a pagina d etrabalho do processo
* @author Fábio Fernandes Bezerra
* @copyright f2bezerra 2024
* @license MIT
*/

(async function init() {

	await waitDocumentReady(document);
	let docArvore = await waitDocumentReady("#ifrArvore");

	var pontoControle = getPontoControleInfo(docArvore);
	pontoControle = pontoControle && PontoControle.fromName(pontoControle.name, pontoControle.link);

	var counter = 0;
	if (pontoControle && pontoControle.actions) {
		for (let action of pontoControle.actions) {
			counter++;
			addCommand("btnPCAcao" + counter,
				"extension://images/sprite.svg#" + (action.icon ?? "next-flag"),
				action.label ?? "Executar ação", null, e => pontoControle.executeAction(action, docArvore, true)
			);
		}
	}

})();