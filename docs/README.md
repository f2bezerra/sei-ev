#  ![SEIev](/docs/logo@128.png)

O SEI<sub>ev</sub> é uma extensão para o Chrome que implementa um conjunto de funcionalidades para aumento de produtividade no uso do SEI (Sistema de Processos Eletrônicos).

Funcionalidaes disponíveis:
- Na página de controle de processos (inicial):
  - Filtro por Ponto de Controle
- No menu principal
  - Configuração de Fluxos de Trabalho baseados nos Pontos de Controle
- Na página de processos:
  - Botões de ação de acordo como configura no fluxo de trabalho dos Pontos de Controle
  - Automatização de operações na transição entre os Pontos de Controle

## Fluxos de Trabalho

Os fluxos de trabalho são um encadeamento de POntos de Controle que definirão as etapas de atendimento de um processo no SEI. Para cada **Ponto de Controle** poderá ser definido um conjunto de ações que ensejarão na mudança do Ponto de Controle atual para um próximo, criando dessa forma um fluxo de processamento da demanda.

### Ações

A execução de uma ação promoverá a alteração do Ponto de Controle atual do processo. Elas serão exibidas na barra superior de comandos do processo SEI. As definições da Ação compreendem:

- **Rótulo**: descrição da ação
- **Ícone**: identificador visual da ação
- **Destino**: próximo Ponto de Controle
- **Operações**: ações intermediárias opcionais executadas **ANTES** da mudança de Ponto de Controle definida pela ação

### Operações

São ações executadas antes da mudança do Ponto de Controle. Basicamente, uma operações consite na execução de comandos pré-determinados. As definições de uma Operação consiste:

- **Nome**: identificação da operação
- **Comando**: comando que será efetivamente executado
- **Parâmetros**: parâmetros do comando
- **Varáveis**: variáveis opcionais que poderão ser utilizadas na execução do comando

### Comandos

  O comando representa um recurso específico do SEI que altera alguma caracterísitica do processo. Os comandos previstos pela extensão são:

#### atribuir

Alterar a atribuição do processo SEI.

Sintaxe:
``atribuir(<login>)``
  
Exemplos:
```javascript
atribuir("fulano")    // Atribuir para o usuário de login 'fulano'
atribuir(@login)      // Atribuir para o usuário logado que executou a operação
atribuir(@anterior)   // Atribuir para o usuário anterior ao do atual que está executando a operação
atribuir()            // Atribuir para ninguém
```


#### marcar

Adicionar um marcador ao processo

Sintaxe:
``marcar(<marcador>, <observacao>)``

Exemplos:
```javascript
marcar("Análise")                     // Adicionar o marcador 'Análise' sem texto de observação
marcar("Análise", "Falhou")           // Adicionar o marcador 'Análise' com texto de observação 'Falhou'
marcar("Análise", "Falhou: $motivo")  // Adicionar o marcador 'Análise' com texto de observação 'Falhou: ' concatenado com o valor da variável $motivo.
```


#### desmarcar

Remover um marcador do processo

Sintaxe:
``desmarcar(<marcador>)``

Exemplo:
```javascript
desmarcar("Análise")  // Remover o marcador 'Análise'
```


#### anotar

Adicionar uma anotação ao processo

Sintaxe:
``anotar(<nota>)``

Exemplo:
```javascript
anotar("OK")     // Adicionar anotação com o texto 'OK'
anotar("$obs")   // Adicionar anotação com o conteúdo da variável $obs
```


#### desanotar

Remover uma anotação do processo

Sintaxe:
``desanotar(<indice>)``

Exemplos:
```javascript
desanotar(0)  // Remover a última anotação
desanotar()   // Remover todas as anotações
```


#### concluir

Encerrar o procesoo 

Sintaxe:
``concluir()``

### Variáveis

São valores informados pelo o usuário durante a execução da Ação. Geralmente aplicadas nos parâmetros dos comandos da ação. A variável é identificada por um cifrão ($) no início do nome, por exemplo ``$var1``.
Os atributos das variáveis são:
- Nome: identificação da variável
- Tipo: tipologia da variável
- Rótulo: Rótulo exibido na aquisição do valor da variável
- Opções: opções aplicáveis de acordo com o tipo da variável

#### Tipo _**text**_

Uma caixa de texto de livre preenchimento é apresentada ao usuário para informar um valor textual para a variável

#### Tipo _**number**_

Uma caixa de texto de livre preenchimento é apresentada ao usuário para informar um valor numérico para a variável

#### Tipo _**select**_

Uma caixa de seleção é apresentada ao usuário para selecionar um dos valores para a variável. As opções disponíveis deverão estar listadas no atributo ``Opções`` da variável, com os valores separados por vírgula.

#### Tipo _**textarea**_

Uma caixa de texto de múltiplas linhas é apresentada ao usuário para informar um texto para a variável. No atributo ``Opções`` é possível informar o número de linhas da caixa de texto.

 
### Macros

São valores de uso geral determinados pela extensão para uso das operações. As macros disponíveis são:

- ``@login`` :	retorna o login do usuário logado
- ``@anterior`` : retorna o login do usuário anterior a quem foi atribuído o processo
- ``@atribuidos`` :	retorna lista de logins dos usuários a quem o processo já foi atribuído
- ``@atribuiveis`` : retorna lista de usuário a quem o processo pode ser atribuído

