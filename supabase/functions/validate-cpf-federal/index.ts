const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ValidateRequest {
  cpf: string;
  birthDate: string;
}

interface ValidationResponse {
  available: boolean;
  message: string;
  registered: boolean;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    const { cpf, birthDate }: ValidateRequest = await req.json();

    if (!cpf || !birthDate) {
      return new Response(
        JSON.stringify({
          available: false,
          message: "CPF and birthDate are required",
          registered: false,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const cleanCpf = cpf.replace(/\D/g, "");
    const token = "gaH6NeFNKDbSU2h10QLjwZuP6XyOtHq3a5PmiJqw";

    const formData = new FormData();
    formData.append("_token", token);
    formData.append("cpf", cleanCpf);
    formData.append("birth", birthDate);
    formData.append("status", "0");
    formData.append("father", "110956");
    formData.append("type", "Recorrente");
    formData.append("name", "TEST");
    formData.append("email", "test@test.com");
    formData.append("phone", "(00) 000000000");
    formData.append("cell", "(00) 00000-0000");
    formData.append("cep", "00000-000");
    formData.append("district", "TEST");
    formData.append("city", "TEST");
    formData.append("state", "SP");
    formData.append("street", "TEST");
    formData.append("number", "0");
    formData.append("typeChip", "fisico");
    formData.append("plan_id", "178");
    formData.append("typeFrete", "Carta");

    const response = await fetch(
      "https://federalassociados.com.br/registroSave",
      {
        method: "POST",
        body: formData,
      }
    );

    const responseText = await response.text();

    const cpfAlreadyRegistered =
      responseText.includes("cpf já está sendo utilizado") ||
      responseText.includes("cpf já existe") ||
      responseText.includes("CPF já cadastrado") ||
      responseText.includes("já está sendo utilizado");

    const result: ValidationResponse = {
      available: !cpfAlreadyRegistered,
      message: cpfAlreadyRegistered
        ? "CPF já está cadastrado"
        : "CPF disponível para cadastro",
      registered: cpfAlreadyRegistered,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({
        available: false,
        message: "Erro ao validar CPF. Tente novamente.",
        registered: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
