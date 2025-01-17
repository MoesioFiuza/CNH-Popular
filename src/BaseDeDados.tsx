import React, { useState, useEffect } from "react";
import "./BaseDeDados.css";
import * as XLSX from "xlsx";

interface BaseDeDadosData {
  categoria: string;
  municipio: string;
  nome: string;
  cnpj: string;
  adesao: string;
  Contrato: string;
  dataDeAbertura: string;
  suite: string;
  status: string;
}

const BaseDeDados: React.FC = () => {
  const [sheetData, setSheetData] = useState<string[][]>([]);
  const [baseData, setBaseData] = useState<BaseDeDadosData[]>([]);
  const [cfcData, setCfcData] = useState<
    { municipio: string; nome: string; cnpj: string }[]
  >([]);
  const [clinicaData, setClinicaData] = useState<
    { municipio: string; nome: string; cnpj: string }[]
  >([]);
  const [regionais, setRegionais] = useState<string[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    if (savedRole) {
      setRole(savedRole);
    }

  }, []);

  // --- ADICIONAR ROLE DO LOCALSTORAGE ---
  const [role, setRole] = useState<string>("");

  // função que lida com a exportação dos dados
  const handleExport = () => {
    const headers =[
      ["CATEG.", "MUNICÍPIO", "NOME", "CNPJ", "ADESAO", "CONTRATO", "DT. ABERTURA", "SUITE", "STATUS"]
    ];

    const sheetData = [
      ...headers,
      ...baseData.map(item => [
        item.categoria, item.municipio, item.nome, item.cnpj, item.adesao, item.Contrato, item.dataDeAbertura, item.suite, item.status

      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Base de Dados");
    XLSX.writeFile(wb, "base-de-dados.xlsx");

  };

  const statusList = [
    "PROCESSO ABERTO (DIHAB)",
    "AUTORIZADO (SUPER)",
    "INFOS ORÇAMENTÁRIAS (NEXEC)",
    "DECLARAÇÃO DE ORDENADOR REALIZADA (DIAF)",
    "CONTRATO ELABORADO (NUCON)",
    "CERTIDÃO LICITAWEB (LICIT)",
    "MAPA DE PREÇOS LICITAWEB ASSINADO (DIAF)",
    "CONTRATO ENVIADO À EMPRESA",
    "CONTRATO ASSINADO DEVOLVIDO AO DETRAN",
    "PARECER JURÍDICO ELABORADO (NUCON)",
    "PARECER ASSINADO (ADV NUCON)",
    "PARECER ASSINADO (DIJUR)",
    "CONTRATO ASSINADO (SUPER)",
    "CADASTRADO NO SISTEMA SACC",
    "EDOWEB OK",
    "OFÍCIO OK",
    "EDOWEB ASSINADO (DIJUR)",
    "OFÍCIO ASSINADO (SUPER)",
    "ENVIADO À CASA CIVIL",
    "CONTRATO PUBLICADO",
    "CLÍNICA COM CRÉDITO A UTILIZAR",
  ];

  // Buscar o papel do usuário (role) no localStorage assim que o componente carregar
  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    if (savedRole) {
      setRole(savedRole);
    }
  }, []);

  const fetchData = async () => {
    try {
      // Fetch regionais
      const regionaisResponse = await fetch(
        "http://127.0.0.1:8000/obter-planilha?aba=Regionais"
      );
      const regionaisData = await regionaisResponse.json();
      const uniqueMunicipios = Array.from(
        new Set(regionaisData.valores.map((row: string[]) => row[0]))
      ) as string[];
      setRegionais(uniqueMunicipios);

      // Fetch CFC
      const cfcResponse = await fetch(
        "http://127.0.0.1:8000/obter-planilha?aba=Cadastro CFC"
      );
      const cfcDataJson = await cfcResponse.json();
      setCfcData(
        cfcDataJson.valores.map((row: string[]) => ({
          municipio: row[5],
          nome: row[0],
          cnpj: row[4],
        }))
      );

      // Fetch Clínicas
      const clinicaResponse = await fetch(
        "http://127.0.0.1:8000/obter-planilha?aba=Cadastro Clínicas"
      );
      const clinicaDataJson = await clinicaResponse.json();
      setClinicaData(
        clinicaDataJson.valores.map((row: string[]) => ({
          municipio: row[5],
          nome: row[0],
          cnpj: row[4],
        }))
      );

      // Fetch Base de Dados
      const baseResponse = await fetch(
        "http://127.0.0.1:8000/obter-planilha?aba=Base de Dados"
      );
      const baseDataJson = await baseResponse.json();
      const baseDataList = baseDataJson.valores.map((row: string[]) => ({
        categoria: row[0] || "",
        municipio: row[1] || "",
        nome: row[2] || "",
        cnpj: row[3] || "",
        adesao: row[4] || "",
        Contrato: row[5] || "",
        dataDeAbertura: row[6] || "",
        suite: row[7] || "",
        status: "",
      }));
      setBaseData(baseDataList);

      // Fetch Contratação
      const contratacaoResponse = await fetch(
        "http://127.0.0.1:8000/obter-planilha?aba=Contratação"
      );
      const contratacaoDataJson = await contratacaoResponse.json();
      const contratacaoList = contratacaoDataJson.valores.map(
        (row: string[]) => {
          const lastSimIndex = row.slice(4, 25).lastIndexOf("Sim");
          const status = lastSimIndex !== -1 ? statusList[lastSimIndex] : "";
          return { status };
        }
      );

      // Vincular o status carregado ao baseData
      setBaseData((prev) =>
        prev.map((item, index) => ({
          ...item,
          status: contratacaoList[index]?.status || "",
        }))
      );

      setIsDataLoaded(true);
    } catch (error) {
      console.error("Erro ao carregar os dados:", error);
    }
  };

  useEffect(() => {
    if (!isDataLoaded) {
      fetchData();
    }
  }, [isDataLoaded]);

  const addNewRow = () => {
    setBaseData([
      ...baseData,
      {
        categoria: "",
        municipio: "",
        nome: "",
        cnpj: "",
        adesao: "",
        Contrato: "",
        dataDeAbertura: "",
        suite: "",
        status: "",
      },
    ]);
  };

  const getAdesaoStyle = (adesao: string) => {
    switch (adesao) {
      case "Aguardando Adesão":
        return { backgroundColor: "#f3e56d", color: "#000" };
      case "Aderiu":
        return { backgroundColor: "#90ee90", color: "#000" };
      case "Não aderiu":
        return { backgroundColor: "#ff6b6b", color: "#fff" };
      default:
        return {};
    }
  };

  const handleSaveChanges = async () => {
    try {
      // Prepara dados para "Base de Dados"
      const baseDataToSave = baseData.map((row) => [
        row.categoria,
        row.municipio,
        row.nome,
        row.cnpj,
        row.adesao,
        row.Contrato,
        row.dataDeAbertura,
        row.suite,
      ]);

      // Prepara dados para "Contratação"
      const contratacaoDataToSave = baseData.map((row) => {
        const statusIndex = statusList.indexOf(row.status);
        return [
          row.Contrato,
          row.suite,
          row.municipio,
          row.categoria,
          ...statusList.map((status, index) =>
            index <= statusIndex ? "Sim" : "Não"
          ),
        ];
      });

      // Atualiza as duas abas
      const responseBaseData = await fetch(
        "http://127.0.0.1:8000/atualizar-planilha",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            aba: "Base de Dados",
            valores: baseDataToSave,
          }),
        }
      );

      const responseContratacao = await fetch(
        "http://127.0.0.1:8000/atualizar-planilha",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            aba: "Contratação!A1:Z10000",
            valores: contratacaoDataToSave,
          }),
        }
      );

      if (!responseBaseData.ok || !responseContratacao.ok) {
        throw new Error("Erro ao salvar os dados na planilha.");
      }

      const resultBaseData = await responseBaseData.json();
      const resultContratacao = await responseContratacao.json();

      console.log("Dados da Base de Dados salvos com sucesso:", resultBaseData);
      console.log(
        "Dados da Contratação salvos com sucesso:",
        resultContratacao
      );
      alert("Alterações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar os dados:", error);
      alert("Erro ao salvar os dados na planilha.");
    }
  };

  return (
    <div className="base-de-dados-container">
      <table className="base-dados-table">
        <thead>
          <tr>
            <th>CATEG.</th>
            <th>MUNICÍPIO</th>
            <th>NOME</th>
            <th>CNPJ</th>
            <th>ADESÃO</th>
            <th>CONTRATO</th>
            <th>DT. ABERTURA</th>
            <th>SUITE</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {baseData.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td>
                <select
                  value={row.categoria}
                  disabled={role === "Dihab"}
                  onChange={(e) => {
                    const categoria = e.target.value;
                    setBaseData((prev) => {
                      const newData = [...prev];
                      newData[rowIndex].categoria = categoria;
                      newData[rowIndex].nome = "";
                      newData[rowIndex].cnpj = "";
                      return newData;
                    });
                  }}
                >
                  <option value="">Selecione</option>
                  <option value="CFC">CFC</option>
                  <option value="Clínica">Clínica</option>
                </select>
              </td>
              <td>
                <select
                  value={row.municipio}
                  disabled={role === "Dihab"}
                  onChange={(e) => {
                    const municipio = e.target.value;
                    setBaseData((prev) => {
                      const newData = [...prev];
                      newData[rowIndex].municipio = municipio;
                      return newData;
                    });
                  }}
                >
                  <option value="">Selecione o Município</option>
                  {regionais.map((municipio, index) => (
                    <option key={index} value={municipio}>
                      {municipio}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  value={row.nome}
                  disabled={role === "Dihab"}
                  onChange={(e) => {
                    const nome = e.target.value;
                    const cnpj =
                      row.categoria === "CFC"
                        ? cfcData.find((item) => item.nome === nome)?.cnpj || ""
                        : clinicaData.find((item) => item.nome === nome)
                            ?.cnpj || "";
                    setBaseData((prev) => {
                      const newData = [...prev];
                      newData[rowIndex].nome = nome;
                      newData[rowIndex].cnpj = cnpj;
                      return newData;
                    });
                  }}
                >
                  <option value="">Selecione o Nome</option>
                  {row.categoria === "CFC"
                    ? cfcData.map((item, index) => (
                        <option key={index} value={item.nome}>
                          {item.nome}
                        </option>
                      ))
                    : clinicaData.map((item, index) => (
                        <option key={index} value={item.nome}>
                          {item.nome}
                        </option>
                      ))}
                </select>
              </td>
              <td>
                <input
                  type="text"
                  value={row.cnpj}
                  readOnly
                  disabled={role === "Dihab"}
                />
              </td>
              <td>
                <select
                  value={row.adesao}
                  disabled={role === "Dihab"}
                  onChange={(e) => {
                    const adesao = e.target.value;
                    setBaseData((prev) => {
                      const newData = [...prev];
                      newData[rowIndex].adesao = adesao;
                      return newData;
                    });
                  }}
                  style={getAdesaoStyle(row.adesao)}
                >
                  <option value="">Selecione</option>
                  <option value="Aguardando Adesão">Aguardando Adesão</option>
                  <option value="Aderiu">Aderiu</option>
                  <option value="Não aderiu">Não aderiu</option>
                </select>
              </td>
              <td>
                <input
                  type="text"
                  value={row.Contrato}
                  disabled={role === "Dihab"}
                  onChange={(e) =>
                    setBaseData((prev) => {
                      const newData = [...prev];
                      newData[rowIndex].Contrato = e.target.value;
                      return newData;
                    })
                  }
                />
              </td>
              <td>
                <input
                  type="text"
                  value={row.dataDeAbertura}
                  disabled={role === "Dihab"}
                  onChange={(e) =>
                    setBaseData((prev) => {
                      const newData = [...prev];
                      newData[rowIndex].dataDeAbertura = e.target.value;
                      return newData;
                    })
                  }
                />
              </td>
              <td>
                <input
                  type="text"
                  value={row.suite}
                  disabled={role === "Dihab"}
                  onChange={(e) =>
                    setBaseData((prev) => {
                      const newData = [...prev];
                      newData[rowIndex].suite = e.target.value;
                      return newData;
                    })
                  }
                />
              </td>
              <td>
                <select
                  value={row.status}
                  disabled={role === "Nucon"}
                  onChange={(e) => {
                    const status = e.target.value;
                    setBaseData((prev) => {
                      const newData = [...prev];
                      newData[rowIndex].status = status;
                      return newData;
                    });
                  }}
                >
                  <option value="">Selecione o Status</option>
                  {statusList.map((status, index) => (
                    <option key={index} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="button-container">
        <button className="btn salvar" onClick={handleSaveChanges}>
          Salvar Alterações
        </button>
        <button className="btn exportar" onClick ={handleExport}>
          Exportar
        </button>
      </div>
      <button className="add-row-button" onClick={addNewRow}>
        +
      </button>
    </div>
  );
};

export default BaseDeDados;