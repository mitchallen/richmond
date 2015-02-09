var Richmond   = require('richmond'),
    config     = require('./config'),
    controller = config.controller,
    service    = config.service,
    micro      = new Richmond(service),
    modelName  = "MyTest";

micro.controller(
    controller.setup({
        del:        [{ model: modelName, rights: "PUBLIC" }],
        getOne:     [{ model: modelName, rights: "PUBLIC" }],
        getMany:    [{ model: modelName, rights: "PUBLIC" }],
        post:       [{ model: modelName, rights: "PUBLIC" }],
        put:        [{ model: modelName, rights: "PUBLIC" }],
        patch:      [{ model: modelName, rights: "PUBLIC" }],
    })
);
micro.addModel(modelName, {
    email:    { type: String, required: true },
    status:   { type: String, required: true },
    password: { type: String, select: false },
});
micro.listen();
console.log("Listening on port:", service.port);