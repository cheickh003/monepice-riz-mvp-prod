import { defineMiddlewares } from "@medusajs/framework/http"
import cors from "cors"

export default defineMiddlewares({
  routes: [
    {
      matcher: "*",
      middlewares: [
        cors({
          origin: process.env.CORS_ORIGIN?.split(",") || [
            "http://localhost:3000",
            "https://monepiceriz.com",
            "https://admin.monepiceriz.com"
          ],
          credentials: true,
        }),
      ],
    },
  ],
})