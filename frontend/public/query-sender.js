/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function (query) {
    return new Promise(function (fulfill, reject) {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", "/query", true);
        xhr.send(JSON.stringify(query));
        xhr.onload = function () {
            return fulfill(xhr.response);
        };
        xhr.onerror = function () {
            return reject(errorMessage);
        }
        // console.log("CampusExplorer.sendQuery not implemented yet.");
    });
};
