
// Encontrar os elementos do HTML
const campoTarefa = document.getElementById("campo-tarefa");
const botaoAdicionar = document.getElementById("botao-adicionar");
const listaTarefas = document.getElementById("lista-tarefas");
const campoPesquisa = document.getElementById("campo-pesquisa");
const campoPrioridade = document.getElementById("campo-prioridade");

// Elementos do progresso
const contadorTotal = document.getElementById("contador-total");
const contadorPendentes = document.getElementById("contador-pendentes");
const contadorConcluidas = document.getElementById("contador-concluidas");
const textoProgresso = document.getElementById("texto-progresso");
const progressoPreenchido = document.getElementById("progresso-preenchido");

// Filtro selecionado
let filtroAtual = "todas";

// Lista de tarefas carregadas do Python
let tarefas = [];


// Buscar tarefas no Python
async function carregarTarefas() {
    try {
        const resposta = await fetch("/api/tarefas");

        if (!resposta.ok) {
            throw new Error("Erro ao buscar tarefas.");
        }

        tarefas = await resposta.json();

        atualizarTela();

    } catch (erro) {
        console.error("Erro ao carregar tarefas:", erro);
        alert("Não foi possível carregar as tarefas.");
    }
}


// Atualizar a tela inteira
function atualizarTela() {
    atualizarContadores();
    mostrarTarefas();
}


// Atualizar os números e a barra de progresso
function atualizarContadores() {
    const total = tarefas.length;

    const concluidas = tarefas.filter(
        tarefa => tarefa.concluida
    ).length;

    const pendentes = total - concluidas;

    const porcentagem = total === 0
        ? 0
        : Math.round((concluidas / total) * 100);

    contadorTotal.textContent = total;
    contadorPendentes.textContent = pendentes;
    contadorConcluidas.textContent = concluidas;

    textoProgresso.textContent = porcentagem + "%";

    progressoPreenchido.style.width = porcentagem + "%";
}


// Mostrar as tarefas de acordo com o filtro
function mostrarTarefas() {
    listaTarefas.innerHTML = "";

    // Aplicar o filtro selecionado
    let tarefasFiltradas = tarefas;

    if (filtroAtual === "pendentes") {
        tarefasFiltradas = tarefas.filter(
            tarefa => !tarefa.concluida
        );
    }

    if (filtroAtual === "concluidas") {
        tarefasFiltradas = tarefas.filter(
            tarefa => tarefa.concluida
        );
    }

    // Aplicar a pesquisa
    const pesquisa = campoPesquisa.value.toLowerCase().trim();

    tarefasFiltradas = tarefasFiltradas.filter(
        tarefa => tarefa.texto.toLowerCase().includes(pesquisa)
    );

    if (tarefasFiltradas.length === 0) {
        mostrarListaVazia();
        return;
    }

    tarefasFiltradas.forEach(criarElementoTarefa);
}


// Criar o elemento visual de cada tarefa
function criarElementoTarefa(tarefa) {
    const item = document.createElement("li");

    item.dataset.id = tarefa.id;

    if (tarefa.concluida) {
        item.classList.add("concluida");
    }

    // Checkbox
    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.checked = tarefa.concluida;

    // Texto
    const texto = document.createElement("span");

    texto.textContent = tarefa.texto;

    const etiquetaPrioridade = document.createElement("span");

    etiquetaPrioridade.textContent =
        "Prioridade: " + tarefa.prioridade;

    etiquetaPrioridade.classList.add(
        "prioridade",
        tarefa.prioridade
    );

    const botaoExcluir = document.createElement("button");

    botaoExcluir.textContent = "Excluir";
    botaoExcluir.classList.add("botao-excluir");

    // Botão editar
    const botaoEditar = document.createElement("button");

    botaoEditar.textContent = "Editar";
    botaoEditar.classList.add("botao-editar");


    // Concluir ou reabrir tarefa
    checkbox.addEventListener("change", async function () {
        try {
            const resposta = await fetch(
                `/api/tarefas/${tarefa.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        concluida: checkbox.checked
                    })
                }
            );

            if (!resposta.ok) {
                throw new Error("Não foi possível atualizar a tarefa.");
            }

            // Atualizar a tarefa na lista
            const tarefaAtualizada = await resposta.json();

            tarefas = tarefas.map(function (item) {
                if (item.id === tarefaAtualizada.id) {
                    return tarefaAtualizada;
                }

                return item;
            });

            atualizarTela();

        } catch (erro) {
            alert("Erro ao concluir a tarefa.");
            console.error(erro);

            carregarTarefas();
        }
    });


    // Excluir tarefa
    botaoExcluir.addEventListener("click", async function () {
        try {
            const resposta = await fetch(
                `/api/tarefas/${tarefa.id}`,
                { method: "DELETE" }
            );

            if (!resposta.ok) {
                throw new Error("Não foi possível excluir a tarefa.");
            }

            tarefas = tarefas.filter(
                item => item.id !== tarefa.id
            );

            atualizarTela();

        } catch (erro) {
            alert("Erro ao excluir a tarefa.");
            console.error(erro);
        }
    });

    
// Editar o texto da tarefa
botaoEditar.addEventListener("click", async function () {

    const novoTexto = prompt(
        "Digite o novo texto da tarefa:",
        tarefa.texto
    );

    if (novoTexto === null || novoTexto.trim() === "") {
        return;
    }

    try {
        const resposta = await fetch(
            `/api/tarefas/${tarefa.id}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    texto: novoTexto.trim()
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro ao editar tarefa.");
        }

        tarefas = tarefas.map(function (item) {
            if (item.id === dados.id) {
                return dados;
            }

            return item;
        });

        atualizarTela();

    } catch (erro) {
        alert("Não foi possível editar a tarefa.");
        console.error(erro);
    }
});



    // Adicionar elementos ao item
    item.appendChild(checkbox);
    item.appendChild(texto);
    item.appendChild(etiquetaPrioridade);
    item.appendChild(botaoEditar);
    item.appendChild(botaoExcluir);

    listaTarefas.appendChild(item);
}


// Adicionar uma nova tarefa
async function adicionarTarefa() {
    const texto = campoTarefa.value.trim();
    const prioridade = campoPrioridade.value;

    if (texto === "") {
        alert("Digite uma tarefa antes de adicionar!");
        return;
    }

    try {
        const resposta = await fetch("/api/tarefas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                texto: texto,
                prioridade: prioridade
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro ao adicionar tarefa.");
        }

        tarefas.push(dados);

        campoTarefa.value = "";
        campoPrioridade.value = "media";
        campoTarefa.focus();

        atualizarTela();

    } catch (erro) {
        alert("Não foi possível adicionar a tarefa.");
        console.error(erro);
    }
}


// Mostrar mensagem quando não houver tarefas no filtro
function mostrarListaVazia() {
    const mensagem = document.createElement("li");

    mensagem.classList.add("tarefa-vazia");

    if (tarefas.length === 0) {
        mensagem.textContent = "Suas tarefas aparecerão aqui.";
    } else {
        mensagem.textContent = "Nenhuma tarefa encontrada neste filtro.";
    }

    listaTarefas.appendChild(mensagem);
}


// Controlar os filtros
const botoesFiltro = document.querySelectorAll(".filtro");

botoesFiltro.forEach(function (botao) {
    botao.addEventListener("click", function () {

        filtroAtual = botao.dataset.filtro;

        // Remover destaque dos outros botões
        botoesFiltro.forEach(function (item) {
            item.classList.remove("ativo");
        });

        // Destacar o filtro selecionado
        botao.classList.add("ativo");

        atualizarTela();
    });
});


// Eventos dos botões
botaoAdicionar.addEventListener("click", adicionarTarefa);

campoTarefa.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
        adicionarTarefa();
    }
});


// Carregar tarefas ao abrir o site
carregarTarefas();

campoPesquisa.addEventListener("input", function () {
    mostrarTarefas();
});
