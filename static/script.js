
// Encontrar os elementos do HTML
const campoTarefa = document.getElementById("campo-tarefa");
const botaoAdicionar = document.getElementById("botao-adicionar");
const listaTarefas = document.getElementById("lista-tarefas");

// Buscar as tarefas que estão no Python
async function carregarTarefas() {
    try {
        const resposta = await fetch("/api/tarefas");
        const tarefas = await resposta.json();

        listaTarefas.innerHTML = "";

        if (tarefas.length === 0) {
            mostrarListaVazia();
            return;
        }

        tarefas.forEach(criarElementoTarefa);
    } catch (erro) {
        console.error("Erro ao carregar tarefas:", erro);
        alert("Não foi possível carregar as tarefas.");
    }
}

// Criar o elemento visual de cada tarefa
function criarElementoTarefa(tarefa) {
    const item = document.createElement("li");
    item.dataset.id = tarefa.id;

    if (tarefa.concluida) {
        item.classList.add("concluida");
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = tarefa.concluida;

    const texto = document.createElement("span");
    texto.textContent = tarefa.texto;

    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.classList.add("botao-excluir");

    // Atualizar o estado da tarefa no Python
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

            item.classList.toggle("concluida", checkbox.checked);
        } catch (erro) {
            checkbox.checked = !checkbox.checked;
            alert("Erro ao concluir a tarefa.");
            console.error(erro);
        }
    });

    // Excluir a tarefa no Python
    botaoExcluir.addEventListener("click", async function () {
        try {
            const resposta = await fetch(
                `/api/tarefas/${tarefa.id}`,
                { method: "DELETE" }
            );

            if (!resposta.ok) {
                throw new Error("Não foi possível excluir a tarefa.");
            }

            item.remove();

            if (listaTarefas.children.length === 0) {
                mostrarListaVazia();
            }
        } catch (erro) {
            alert("Erro ao excluir a tarefa.");
            console.error(erro);
        }
    });

    item.appendChild(checkbox);
    item.appendChild(texto);
    item.appendChild(botaoExcluir);

    listaTarefas.appendChild(item);
}

// Enviar uma nova tarefa para o Python
async function adicionarTarefa() {
    const texto = campoTarefa.value.trim();

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
            body: JSON.stringify({ texto: texto })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro ao adicionar tarefa.");
        }

        const mensagem = listaTarefas.querySelector(".tarefa-vazia");

        if (mensagem) {
            mensagem.remove();
        }

        criarElementoTarefa(dados);

        campoTarefa.value = "";
        campoTarefa.focus();
    } catch (erro) {
        alert("Não foi possível adicionar a tarefa.");
        console.error(erro);
    }
}

// Mostrar uma mensagem quando não houver tarefas
function mostrarListaVazia() {
    const mensagem = document.createElement("li");
    mensagem.classList.add("tarefa-vazia");
    mensagem.textContent = "Suas tarefas aparecerão aqui.";

    listaTarefas.appendChild(mensagem);
}

// Conectar os eventos
botaoAdicionar.addEventListener("click", adicionarTarefa);

campoTarefa.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
        adicionarTarefa();
    }
});

// Carregar tarefas ao abrir o site
carregarTarefas();
