import React, { useState, useEffect } from "react";
import "./CadastroPostoDetran.css";

interface PostoDetranData {
  municipio: string;
  endereco: string;
}

const CadastroPostoDetran: React.FC = () => {
  const [postosData, setPostosData] = useState<PostoDetranData[]>([
    { municipio: "", endereco: "" },
  ]); // Linha inicial

  // Função para buscar os dados existentes da planilha
  const fetchPostosData = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/obter-planilha?aba=Cadastro Posto Detran&range=A2:Z1000"
      );
      if (!response.ok) {
        throw new Error("Erro ao obter dados da planilha.");
      }
      const data = await response.json();
      console.log("Dados recebidos:", data); // Verificando os dados
      if (data.status === "sucesso") {
        // Se os dados forem recebidos com sucesso, remove o cabeçalho e atualiza o estado
        const dataWithoutHeader = data.valores.map((row: string[]) => ({
          municipio: row[0] || "",
          endereco: row[1] || "",
        }));
        setPostosData(dataWithoutHeader); // Atualiza os dados no estado
      }
    } catch (error) {
      console.error("Erro ao carregar os dados:", error);
    }
  };

  // Função para lidar com a alteração dos valores das células
  const handleInputChange = (
    rowIndex: number,
    field: string,
    value: string
  ) => {
    const newData = [...postosData];
    newData[rowIndex][field as keyof PostoDetranData] = value;
    setPostosData(newData);
  };

  // Função para adicionar uma nova linha em branco
  const addNewRow = () => {
    setPostosData([...postosData, { municipio: "", endereco: "" }]);
  };

  // Função para salvar as alterações na planilha
  const handleSubmit = async () => {
    try {
      // Passo 1: Obter os dados atuais da planilha
      const response = await fetch(
        "http://127.0.0.1:8000/obter-planilha?aba=Cadastro Posto Detran&range=A2:Z1000"
      );
      if (!response.ok) {
        throw new Error("Erro ao obter dados da planilha.");
      }
      const currentData = await response.json();
      let currentValues =
        currentData.status === "sucesso" ? currentData.valores : [];

      // Passo 2: Adicionar os novos dados no final
      const formattedData = postosData.map((row) => [
        row.municipio || "", // Garantir que o valor não seja undefined ou null
        row.endereco || "",
      ]);

      // Adicionando os novos dados aos existentes
      currentValues = [...currentValues, ...formattedData];

      // Passo 3: Enviar os dados atualizados para a planilha
      const dataToSend = {
        aba: "Cadastro Posto Detran", // Especifica a aba "Cadastro Posto Detran"
        valores: currentValues, // Envia os dados combinados (atualizados)
      };

      const saveResponse = await fetch(
        "http://127.0.0.1:8000/atualizar-planilha",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend), // Envia os dados combinados para o backend
        }
      );

      if (!saveResponse.ok) {
        throw new Error("Erro ao salvar os dados na planilha.");
      }

      const result = await saveResponse.json();
      console.log("Dados salvos com sucesso:", result);
      alert("Cadastro salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar os dados:", error);
      alert("Erro ao salvar os dados na planilha.");
    }
  };

  useEffect(() => {
    fetchPostosData();
  }, []);

  return (
    <div className="cadastro-posto-detran-container">
      <table className="base-dados-table">
        <thead>
          <tr>
            <th>Município</th>
            <th>Endereço</th>
          </tr>
        </thead>
        <tbody>
          {postosData.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td>
                <input
                  type="text"
                  value={row.municipio}
                  onChange={(e) =>
                    handleInputChange(rowIndex, "municipio", e.target.value)
                  }
                  placeholder="Município"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={row.endereco}
                  onChange={(e) =>
                    handleInputChange(rowIndex, "endereco", e.target.value)
                  }
                  placeholder="Endereço"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="button-container">
        <button className="btn salvar" onClick={handleSubmit}>
          Salvar Alterações
        </button>
      </div>
      <button className="add-row-button" onClick={addNewRow}>
        +
      </button>
    </div>
  );
};

export default CadastroPostoDetran;