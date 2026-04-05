import { Elysia, t } from "elysia";
const PORT = process.env.PORT!;
const app = new Elysia();

app.get("/", () => {
  return new Response(
    `
    <h1>Elysia telegram cloude storage</h1>
    `,
    {
      headers: {
        "Content-Type": "text/html",
      },
    },
  );
});

app.get("/api", () => {
  return {
    msg: "Elysia telegram cloude storage api",
  };
});

app.post(
  "/api/webhook",
  async ({ body }) => {
    console.log("Отримано дані від TG:", body);
    return { ok: true };
  },
  {
    body: t.Object({}, { additionalProperties: true }),
    // це каже Elysia: "це об'єкт, і я дозволяю будь-які поля"
  },
);

app.listen(PORT, () => {
  console.log(`server run on http://localhost:${PORT}`);
});

export default app;
