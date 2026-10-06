/**
 * Base de cidades brasileiras e busca inteligente com CEP opcional (ViaCEP + BrasilAPI).
 * Atende capitais, regiões metropolitanas e principais pólos e cidades do interior de todos os estados.
 */

export interface CepLookupResult {
  cep: string;
  city: string;
  state: string;
  fullCity: string;
  street: string;
  neighborhood: string;
  formattedAddress: string;
}

export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Consulta CEP em tempo real via ViaCEP com fallback automático para BrasilAPI.
 * Retorna cidade, estado, logradouro e bairro estruturados.
 */
export async function fetchAddressFromCep(rawCep: string): Promise<CepLookupResult | null> {
  const cleanCep = rawCep.replace(/\D/g, "");
  if (cleanCep.length !== 8) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);

  try {
    // 1ª Tentativa: ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (response.ok) {
      const data = await response.json();
      if (!data.erro && data.localidade && data.uf) {
        clearTimeout(timeoutId);
        const street = (data.logradouro || "").trim();
        const neighborhood = (data.bairro || "").trim();
        const parts: string[] = [];
        if (street) parts.push(street);
        if (neighborhood) parts.push(neighborhood);

        return {
          cep: data.cep || formatCep(cleanCep),
          city: data.localidade.trim(),
          state: data.uf.trim().toUpperCase(),
          fullCity: `${data.localidade.trim()}, ${data.uf.trim().toUpperCase()}`,
          street,
          neighborhood,
          formattedAddress: parts.join(" - "),
        };
      }
    }
  } catch {
    // Falha silenciosa para tentar o fallback
  } finally {
    clearTimeout(timeoutId);
  }

  // 2ª Tentativa: BrasilAPI (Fallback robusto)
  try {
    const fallbackController = new AbortController();
    const fallbackTimeout = setTimeout(() => fallbackController.abort(), 4000);

    const fallbackRes = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`, {
      signal: fallbackController.signal,
    });
    clearTimeout(fallbackTimeout);

    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      if (data.city && data.state) {
        const street = (data.street || "").trim();
        const neighborhood = (data.neighborhood || "").trim();
        const parts: string[] = [];
        if (street) parts.push(street);
        if (neighborhood) parts.push(neighborhood);

        return {
          cep: formatCep(cleanCep),
          city: data.city.trim(),
          state: data.state.trim().toUpperCase(),
          fullCity: `${data.city.trim()}, ${data.state.trim().toUpperCase()}`,
          street,
          neighborhood,
          formattedAddress: parts.join(" - "),
        };
      }
    }
  } catch {
    // Sem conexão ou CEP inexistente
  }

  return null;
}

/**
 * Principais cidades brasileiras cobrindo capitais, regiões metropolitanas e pólos do interior de todos os estados.
 */
export const POPULAR_CITIES: string[] = [
  // São Paulo (Capital, Grande SP, Litoral e Interior)
  "São Paulo, SP",
  "Campinas, SP",
  "Guarulhos, SP",
  "São Bernardo do Campo, SP",
  "Santo André, SP",
  "Osasco, SP",
  "Ribeirão Preto, SP",
  "Sorocaba, SP",
  "São José dos Campos, SP",
  "Santos, SP",
  "Mauá, SP",
  "São José do Rio Preto, SP",
  "Mogi das Cruzes, SP",
  "Diadema, SP",
  "Jundiaí, SP",
  "Piracicaba, SP",
  "Carapicuíba, SP",
  "Bauru, SP",
  "Itaquaquecetuba, SP",
  "Franca, SP",
  "Praia Grande, SP",
  "São Vicente, SP",
  "Barueri, SP",
  "Taubaté, SP",
  "Suzano, SP",
  "Limeira, SP",
  "Taboão da Serra, SP",
  "Sumaré, SP",
  "Embu das Artes, SP",
  "Indaiatuba, SP",
  "Cotia, SP",
  "Americana, SP",
  "Araraquara, SP",
  "Jacareí, SP",
  "Hortolândia, SP",
  "Presidente Prudente, SP",
  "Marília, SP",
  "Rio Claro, SP",
  "Araçatuba, SP",
  "Santa Bárbara d'Oeste, SP",
  "Bragança Paulista, SP",
  "Itu, SP",
  "São Carlos, SP",
  "Atibaia, SP",
  "Pindamonhangaba, SP",
  "Guarujá, SP",
  "Itapetininga, SP",
  "Jaú, SP",
  "Botucatu, SP",
  "Votorantim, SP",
  "Valinhos, SP",
  "Mogi Guaçu, SP",
  "Sertãozinho, SP",
  "Salto, SP",

  // Rio de Janeiro
  "Rio de Janeiro, RJ",
  "São Gonçalo, RJ",
  "Duque de Caxias, RJ",
  "Nova Iguaçu, RJ",
  "Niterói, RJ",
  "Belford Roxo, RJ",
  "Campos dos Goytacazes, RJ",
  "São João de Meriti, RJ",
  "Petrópolis, RJ",
  "Volta Redonda, RJ",
  "Macaé, RJ",
  "Magé, RJ",
  "Itaboraí, RJ",
  "Cabo Frio, RJ",
  "Angra dos Reis, RJ",
  "Nova Friburgo, RJ",
  "Barra Mansa, RJ",
  "Teresópolis, RJ",
  "Mesquita, RJ",
  "Nilópolis, RJ",
  "Maricá, RJ",
  "Queimados, RJ",
  "Resende, RJ",
  "Araruama, RJ",
  "Rio das Ostras, RJ",

  // Minas Gerais
  "Belo Horizonte, MG",
  "Uberlândia, MG",
  "Contagem, MG",
  "Juiz de Fora, MG",
  "Betim, MG",
  "Montes Claros, MG",
  "Ribeirão das Neves, MG",
  "Uberaba, MG",
  "Governador Valadares, MG",
  "Ipatinga, MG",
  "Sete Lagoas, MG",
  "Divinópolis, MG",
  "Santa Luzia, MG",
  "Ibirité, MG",
  "Poços de Caldas, MG",
  "Patos de Minas, MG",
  "Pouso Alegre, MG",
  "Teófilo Otoni, MG",
  "Barbacena, MG",
  "Sabará, MG",
  "Varginha, MG",
  "Conselheiro Lafaiete, MG",
  "Araguari, MG",
  "Itabira, MG",
  "Passos, MG",
  "Coronel Fabriciano, MG",
  "Muriaé, MG",
  "Ubá, MG",
  "Nova Serrana, MG",
  "Lavras, MG",

  // Paraná
  "Curitiba, PR",
  "Londrina, PR",
  "Maringá, PR",
  "Ponta Grossa, PR",
  "Cascavel, PR",
  "São José dos Pinhais, PR",
  "Foz do Iguaçu, PR",
  "Colombo, PR",
  "Guarapuava, PR",
  "Paranaguá, PR",
  "Araucária, PR",
  "Toledo, PR",
  "Apucarana, PR",
  "Pinhais, PR",
  "Campo Largo, PR",
  "Arapongas, PR",
  "Almirante Tamandaré, PR",
  "Umuarama, PR",
  "Piraquara, PR",
  "Cambé, PR",
  "Fazenda Rio Grande, PR",
  "Sarandi, PR",
  "Campo Mourão, PR",
  "Francisco Beltrão, PR",
  "Paranavaí, PR",
  "Pato Branco, PR",

  // Rio Grande do Sul
  "Porto Alegre, RS",
  "Caxias do Sul, RS",
  "Canoas, RS",
  "Pelotas, RS",
  "Santa Maria, RS",
  "Gravataí, RS",
  "Viamão, RS",
  "Novo Hamburgo, RS",
  "São Leopoldo, RS",
  "Rio Grande, RS",
  "Alvorada, RS",
  "Passo Fundo, RS",
  "Sapucaia do Sul, RS",
  "Uruguaiana, RS",
  "Santa Cruz do Sul, RS",
  "Cachoeirinha, RS",
  "Bento Gonçalves, RS",
  "Bagé, RS",
  "Erechim, RS",
  "Guaíba, RS",
  "Lajeado, RS",
  "Ijuí, RS",

  // Santa Catarina
  "Florianópolis, SC",
  "Joinville, SC",
  "Blumenau, SC",
  "São José, SC",
  "Chapecó, SC",
  "Itajaí, SC",
  "Criciúma, SC",
  "Jaraguá do Sul, SC",
  "Palhoça, SC",
  "Lages, SC",
  "Balneário Camboriú, SC",
  "Brusque, SC",
  "Tubarão, SC",
  "São Bento do Sul, SC",
  "Camboriú, SC",
  "Navegantes, SC",
  "Caçador, SC",
  "Concórdia, SC",
  "Gaspar, SC",
  "Rio do Sul, SC",

  // Bahia
  "Salvador, BA",
  "Feira de Santana, BA",
  "Vitória da Conquista, BA",
  "Camaçari, BA",
  "Itabuna, BA",
  "Juazeiro, BA",
  "Lauro de Freitas, BA",
  "Ilhéus, BA",
  "Jequié, BA",
  "Teixeira de Freitas, BA",
  "Barreiras, BA",
  "Alagoinhas, BA",
  "Porto Seguro, BA",
  "Simões Filho, BA",
  "Paulo Afonso, BA",
  "Eunápolis, BA",
  "Santo Antônio de Jesus, BA",
  "Valença, BA",

  // Pernambuco
  "Recife, PE",
  "Jaboatão dos Guararapes, PE",
  "Olinda, PE",
  "Caruaru, PE",
  "Petrolina, PE",
  "Paulista, PE",
  "Cabo de Santo Agostinho, PE",
  "Camaragibe, PE",
  "Garanhuns, PE",
  "Vitória de Santo Antão, PE",
  "Igarassu, PE",
  "São Lourenço da Mata, PE",
  "Abreu e Lima, PE",
  "Ipojuca, PE",
  "Serra Talhada, PE",

  // Ceará
  "Fortaleza, CE",
  "Caucaia, CE",
  "Juazeiro do Norte, CE",
  "Maracanaú, CE",
  "Sobral, CE",
  "Crato, CE",
  "Itapipoca, CE",
  "Maranguape, CE",
  "Iguatu, CE",
  "Quixadá, CE",
  "Aquiraz, CE",
  "Canindé, CE",

  // Goiás & Distrito Federal
  "Brasília, DF",
  "Goiânia, GO",
  "Aparecida de Goiânia, GO",
  "Anápolis, GO",
  "Rio Verde, GO",
  "Águas Lindas de Goiás, GO",
  "Luziânia, GO",
  "Valparaíso de Goiás, GO",
  "Trindade, GO",
  "Formosa, GO",
  "Novo Gama, GO",
  "Senador Canedo, GO",
  "Itumbiara, GO",
  "Catalão, GO",
  "Jataí, GO",
  "Planaltina, GO",
  "Caldas Novas, GO",

  // Espírito Santo
  "Vitória, ES",
  "Vila Velha, ES",
  "Serra, ES",
  "Cariacica, ES",
  "Cachoeiro de Itapemirim, ES",
  "Linhares, ES",
  "São Mateus, ES",
  "Colatina, ES",
  "Guarapari, ES",
  "Aracruz, ES",

  // Pará & Amazonas
  "Manaus, AM",
  "Parintins, AM",
  "Itacoatiara, AM",
  "Belém, PA",
  "Ananindeua, PA",
  "Santarém, PA",
  "Marabá, PA",
  "Parauapebas, PA",
  "Castanhal, PA",
  "Abaetetuba, PA",

  // Maranhão, Paraíba, Rio Grande do Norte, Alagoas, Sergipe, Piauí
  "São Luís, MA",
  "Imperatriz, MA",
  "Caxias, MA",
  "Timon, MA",
  "João Pessoa, PB",
  "Campina Grande, PB",
  "Santa Rita, PB",
  "Patos, PB",
  "Natal, RN",
  "Mossoró, RN",
  "Parnamirim, RN",
  "São Gonçalo do Amarante, RN",
  "Maceió, AL",
  "Arapiraca, AL",
  "Rio Largo, AL",
  "Aracaju, SE",
  "Nossa Senhora do Socorro, SE",
  "Lagarto, SE",
  "Itabaiana, SE",
  "Teresina, PI",
  "Parnaíba, PI",
  "Picos, PI",

  // Mato Grosso & Mato Grosso do Sul
  "Cuiabá, MT",
  "Várzea Grande, MT",
  "Rondonópolis, MT",
  "Sinop, MT",
  "Tangará da Serra, MT",
  "Sorriso, MT",
  "Campo Grande, MS",
  "Dourados, MS",
  "Três Lagoas, MS",
  "Corumbá, MS",
  "Ponta Porã, MS",

  // Norte (Tocantins, Rondônia, Acre, Amapá, Roraima)
  "Palmas, TO",
  "Araguaína, TO",
  "Gurupi, TO",
  "Porto Velho, RO",
  "Ji-Paraná, RO",
  "Ariquemes, RO",
  "Cacoal, RO",
  "Rio Branco, AC",
  "Cruzeiro do Sul, AC",
  "Macapá, AP",
  "Santana, AP",
  "Boa Vista, RR",
];

export const BRAZILIAN_STATES = [
  { uf: "SP", name: "São Paulo" },
  { uf: "RJ", name: "Rio de Janeiro" },
  { uf: "MG", name: "Minas Gerais" },
  { uf: "PR", name: "Paraná" },
  { uf: "RS", name: "Rio Grande do Sul" },
  { uf: "SC", name: "Santa Catarina" },
  { uf: "BA", name: "Bahia" },
  { uf: "PE", name: "Pernambuco" },
  { uf: "CE", name: "Ceará" },
  { uf: "GO", name: "Goiás" },
  { uf: "DF", name: "Distrito Federal" },
  { uf: "ES", name: "Espírito Santo" },
  { uf: "MT", name: "Mato Grosso" },
  { uf: "MS", name: "Mato Grosso do Sul" },
  { uf: "PA", name: "Pará" },
  { uf: "AM", name: "Amazonas" },
  { uf: "MA", name: "Maranhão" },
  { uf: "PB", name: "Paraíba" },
  { uf: "RN", name: "Rio Grande do Norte" },
  { uf: "AL", name: "Alagoas" },
  { uf: "SE", name: "Sergipe" },
  { uf: "PI", name: "Piauí" },
  { uf: "TO", name: "Tocantins" },
  { uf: "RO", name: "Rondônia" },
  { uf: "AC", name: "Acre" },
  { uf: "AP", name: "Amapá" },
  { uf: "RR", name: "Roraima" },
];

/**
 * Busca rápida e assertiva de cidades no banco brasileiro.
 * Classifica com prioridade cidades que começam com o termo pesquisado.
 */
export function searchCities(
  query: string,
  stateFilter?: string,
  limit: number = 24,
): string[] {
  const cleanQuery = normalizeText(query);
  const cleanState = stateFilter ? stateFilter.toUpperCase().trim() : "";

  let list = POPULAR_CITIES;

  if (cleanState && cleanState !== "TODOS") {
    list = list.filter((city) => city.endsWith(`, ${cleanState}`));
  }

  if (!cleanQuery) {
    return list.slice(0, limit);
  }

  const exactStarts: string[] = [];
  const wordStarts: string[] = [];
  const contains: string[] = [];

  for (const city of list) {
    const norm = normalizeText(city);
    const cityNameOnly = norm.split(",")[0].trim();

    if (cityNameOnly.startsWith(cleanQuery)) {
      exactStarts.push(city);
    } else if (cityNameOnly.split(" ").some((w) => w.startsWith(cleanQuery))) {
      wordStarts.push(city);
    } else if (norm.includes(cleanQuery)) {
      contains.push(city);
    }
  }

  return [...exactStarts, ...wordStarts, ...contains].slice(0, limit);
}
