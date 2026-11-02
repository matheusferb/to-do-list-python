
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
                concluida INTEGER NOT NULL DEFAULT 0,
                prioridade TEXT NOT NULL DEFAULT 'media'
            )
        """)

        colunas = conexao.execute(
            "PRAGMA table_info(tarefas)"
        ).fetchall()

        nomes_colunas = [coluna["name"] for coluna in colunas]

        if "prioridade" not in nomes_colunas:
            conexao.execute("""
                ALTER TABLE tarefas
                ADD COLUMN prioridade TEXT NOT NULL DEFAULT 'media'
            """)

        if "data_vencimento" not in nomes_colunas:
            conexao.execute("""
                ALTER TABLE tarefas
                ADD COLUMN data_vencimento TEXT
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
            "concluida": bool(linha["concluida"]),
            "prioridade": linha["prioridade"]
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
  
          prioridade = dados.get("prioridade", "media")
          data_vencimento = dados.get("data_vencimento", "")

          if data_vencimento and not isinstance(data_vencimento, str):
              return jsonify({"erro": "Data de vencimento inválida."}), 400

          if prioridade not in ["baixa", "media", "alta"]:
              return jsonify({"erro": "Prioridade inválida."}), 400
  
          cursor = conexao.execute(
              """
              INSERT INTO tarefas (texto, prioridade, data_vencimento)
              VALUES (?, ?, ?)
              """,
            (texto.strip(), prioridade, data_vencimento)
          )
  
          tarefa_id = cursor.lastrowid
  
    return jsonify({
        "id": tarefa_id,
        "texto": texto.strip(),
        "concluida": False,
        "prioridade": prioridade,
        "data_vencimento": data_vencimento
    }),201



# Concluir, reabrir ou editar uma tarefa
@app.route("/api/tarefas/<int:tarefa_id>", methods=["PATCH"])
def atualizar_tarefa(tarefa_id):
    dados = request.get_json(silent=True) or {}

    with conectar_banco() as conexao:

        # Verificar se a tarefa existe
        linha = conexao.execute(
            "SELECT * FROM tarefas WHERE id = ?",
            (tarefa_id,)
        ).fetchone()

        if linha is None:
            return jsonify({"erro": "Tarefa não encontrada."}), 404

        texto = dados.get("texto", linha["texto"])
        concluida = dados.get("concluida", bool(linha["concluida"]))
        prioridade = dados.get("prioridade", linha["prioridade"])

        # Validar o texto
        if not isinstance(texto, str) or not texto.strip():
            return jsonify({"erro": "Digite um texto válido."}), 400

        # Validar o estado de conclusão
        if not isinstance(concluida, bool):
            return jsonify({"erro": "Estado inválido."}), 400

        if prioridade not in ["baixa", "media", "alta"]:
            return jsonify({"erro": "Prioridade inválida."}), 400

        # Atualizar no banco de dados
        conexao.execute(
            """
            UPDATE tarefas
            SET texto = ?, concluida = ?, prioridade = ?
            WHERE id = ?
            """,
            (texto.strip(), int(concluida), prioridade, tarefa_id)
        )

    return jsonify({
        "id": tarefa_id,
        "texto": texto.strip(),
        "concluida": concluida,
        "prioridade": prioridade
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
