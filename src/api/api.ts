function getCredentials(includeCreds: boolean) {
    const options = {
        credentials: includeCreds ? "include" : "same-origin", // include, *same-origin, omit
        headers: {
            "Content-Type": "application/json",
        },
    } as RequestInit;
    const PUBLIC_ACCT_ID = require('../stores/user').PUBLIC_ACCT_ID;
    if (PUBLIC_ACCT_ID) {
        (options.headers as any)['get-public-account'] = PUBLIC_ACCT_ID;
    }
    return options;
}

export function post(url = ``, data = {}, includeCreds: boolean = true) {
    // Default options are marked with *
    return fetch(url, {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, cors, *same-origin
        credentials: includeCreds ? "include" : "same-origin", // include, *same-origin, omit
        headers: {
            "Content-Type": "application/json",
        },
        redirect: "follow", // manual, *follow, error
        referrer: "no-referrer", // no-referrer, *client
        body: JSON.stringify(data), // body data type must match "Content-Type" header
    })
        .then(response => response.json()); // parses response to JSON
}

export function put(url = ``, data = {}, includeCreds: boolean = true) {
    // Default options are marked with *
    return fetch(url, {
        method: "PUT", // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, cors, *same-origin
        credentials: includeCreds ? "include" : "same-origin", // include, *same-origin, omit
        headers: {
            "Content-Type": "application/json",
        },
        redirect: "follow", // manual, *follow, error
        referrer: "no-referrer", // no-referrer, *client
        body: JSON.stringify(data), // body data type must match "Content-Type" header
    })
        .then(response => response.json()); // parses response to JSON
}


export function get(url = ``, includeCreds: boolean = true) {
    // Default options are marked with *
    return fetch(url, {
        method: "GET", // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, cors, *same-origin
        ...getCredentials(includeCreds)
    })
        .then(response => response.json()); // parses response to JSON
}

export function deleteRequest(url = ``, data = {}, includeCreds: boolean = true) {
    // Default options are marked with *
    return fetch(url, {
        method: "DELETE", // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, cors, *same-origin
        credentials: includeCreds ? "include" : "same-origin", // include, *same-origin, omit
        headers: {
            "Content-Type": "application/json",
        },
        redirect: "follow", // manual, *follow, error
        referrer: "no-referrer", // no-referrer, *client
        body: JSON.stringify(data), // body data type must match "Content-Type" header
    })
        .then(response => response.json()); // parses response to JSON
}