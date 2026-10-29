
from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__)

# Nome do arquivo do banco de dados
BANCO = "tarefas.db"


# Conectar ao banco de dados
def conectar_banco():
    conexao = sqlite3.connect(BANCO)
    conexao.row_factory = sqlite3.Row
    return conexao


# Criar a tabela caso ela ainda não exista
def criar_banco():
    with conectar_banco() as conexao:
        conexao.execute("""
            CREATE TABLE IF NOT EXISTS tarefas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                texto TEXT NOT NULL,
                concluida INTEGER NOT NULL DEFAULT 0
            )
        """)


# Página principal
@app.route("/")
def inicio():
    return render_template("index.html")


# Buscar todas as tarefas
@app.route("/api/tarefas", methods=["GET"])
def listar_tarefas():
    with conectar_banco() as conexao:
        resultado = conexao.execute(
            "SELECT * FROM tarefas ORDER BY id"
        ).fetchall()

    tarefas = []

    for linha in resultado:
        tarefas.append({
            "id": linha["id"],
            "texto": linha["texto"],
            "concluida": bool(linha["concluida"])
        })

    return jsonify(tarefas)


# Adicionar uma tarefa
@app.route("/api/tarefas", methods=["POST"])
def adicionar_tarefa():
    dados = request.get_json(silent=True) or {}
    texto = dados.get("texto", "")

    if not isinstance(texto, str) or not texto.strip():
        return jsonify({"erro": "Digite uma tarefa válida."}), 400

    with conectar_banco() as conexao:
        cursor = conexao.execute(
            "INSERT INTO tarefas (texto) VALUES (?)",
            (texto.strip(),)
        )

        tarefa_id = cursor.lastrowid

    return jsonify({
        "id": tarefa_id,
        "texto": texto.strip(),
        "concluida": False
    }), 201


# Concluir ou reabrir uma tarefa
@app.route("/api/tarefas/<int:tarefa_id>", methods=["PATCH"])
def atualizar_tarefa(tarefa_id):
    dados = request.get_json(silent=True) or {}

    if not isinstance(dados.get("concluida"), bool):
        return jsonify({"erro": "Estado inválido."}), 400

    with conectar_banco() as conexao:
        cursor = conexao.execute(
            "UPDATE tarefas SET concluida = ? WHERE id = ?",
            (int(dados["concluida"]), tarefa_id)
        )

        if cursor.rowcount == 0:
            return jsonify({"erro": "Tarefa não encontrada."}), 404

        linha = conexao.execute(
            "SELECT * FROM tarefas WHERE id = ?",
            (tarefa_id,)
        ).fetchone()

    return jsonify({
        "id": linha["id"],
        "texto": linha["texto"],
        "concluida": bool(linha["concluida"])
    })


# Excluir uma tarefa
@app.route("/api/tarefas/<int:tarefa_id>", methods=["DELETE"])
def excluir_tarefa(tarefa_id):
    with conectar_banco() as conexao:
        cursor = conexao.execute(
            "DELETE FROM tarefas WHERE id = ?",
            (tarefa_id,)
        )

        if cursor.rowcount == 0:
            return jsonify({"erro": "Tarefa não encontrada."}), 404

    return jsonify({"mensagem": "Tarefa excluída."})


if __name__ == "__main__":
    criar_banco()
    app.run(debug=True)
