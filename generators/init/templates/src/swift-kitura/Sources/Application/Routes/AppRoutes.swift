func initializeAppRoutes(app: App) {
    app.router.get("/usecase") { request, response, next in
        response.headers["Content-Type"] = "text/plain; charset=utf-8"
        try response.status(.OK).send("Hello from Kitura!").end()
    }
}