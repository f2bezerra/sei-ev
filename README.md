# sei-or
Extensão do SEI com funcionalidades extras voltadas paras as áreas de Outrogas da Anatel - Agência Nacional de Telecomunicações.

---

### 1. Configuração
Após clonar o repositório, executar os seguintes comandos:
```
git submodule update 
cd ./init/jslib
git sparse-checkout init
git sparse-checkout common
```
### 2. Build
Para empacotar a extensão, executar  ``web-ext build -o``

Para o Firefox, é necessário adicionar o **add-on ID** ao final do manifesto, conforme estrutura abaixo:
```json
	"browser_specific_settings": {
		"gecko": {
			"id": "sei-ev.f2bezerra@gmail.com"
		}
	}
```
