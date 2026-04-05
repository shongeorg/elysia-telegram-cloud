import { Elysia } from "elysia";
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

app.listen(PORT, () => {
  console.log(`server run on http://localhost:${PORT}`);
});

export default app;
