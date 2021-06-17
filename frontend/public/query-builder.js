/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = function () {
    let query = {};
    let table = document.getElementsByClassName("tab-panel active")[0];
    let kind = table.getAttribute("data-type");
    let conditions = table.getElementsByClassName("form-group conditions")[0];
    let conditionSelected = getConditionInfo(conditions, kind);
    let columns = table.getElementsByClassName("form-group columns")[0];
    let columnSelected = getSelectedBox(columns, kind);
    let order = table.getElementsByClassName("form-group order")[0];
    let orderSelected = getOrderInfo(order, kind);
    let groups = table.getElementsByClassName("form-group groups")[0];
    let groupSelected = getSelectedBox(groups, kind);
    let transformations = table.getElementsByClassName("form-group transformations")[0];
    let applyInfo = getApplyInfo(transformations, kind);
    query["WHERE"] = conditionSelected["WHERE"];
    let optionInner = {};
    optionInner["COLUMNS"] = columnSelected;
    let check1 = orderSelected["ORDER"]["dir"];
    let chcek2 = orderSelected["ORDER"]["keys"];
    if (orderSelected["ORDER"]["dir"] === "DOWN" || orderSelected["ORDER"]["keys"].length > 0) {
        let inner = {};
        inner["dir"] = orderSelected["ORDER"]["dir"];
        inner["keys"] = orderSelected["ORDER"]["keys"];
        optionInner["ORDER"] = inner;
    }
    query["OPTIONS"] = optionInner;
    let transInner = {};
    if (groupSelected.length > 0 && applyInfo.length < 1) {
        transInner["GROUP"] = groupSelected;
        transInner["APPLY"] = [];
        query["TRANSFORMATIONS"] = transInner;
    } else if (groupSelected.length < 1 && applyInfo.length > 0) {
        transInner["GROUP"] = [];
        transInner["APPLY"] = applyInfo;
        query["TRANSFORMATIONS"] = transInner;
    } else if (groupSelected.length > 0 && applyInfo.length > 0) {
        transInner["GROUP"] = groupSelected;
        transInner["APPLY"] = applyInfo;
        query["TRANSFORMATIONS"] = transInner;
    }
    return query;
};

function getSelectedBoxHelper(elementsInGroup, infos, kind) {
    for (let ele of elementsInGroup) {
        let input = ele.getElementsByTagName("input")[0];
        if (input.checked) {
            if (input.getAttribute("value") !== null || typeof input.getAttribute("value") !== "undefined") {
                infos.push(kind + input.getAttribute("value"));
            }
        }
    }
}

function getSelectedBox(container, kind) {
    let controlGroup = container.getElementsByClassName("control-group")[0];
    let elementsInGroup = controlGroup.getElementsByClassName("control field");
    let infos = [];
    getSelectedBoxHelper(elementsInGroup, infos, kind + "_");
    let transformation = controlGroup.getElementsByClassName("control transformation");
    if (transformation !== null || typeof transformation !== "undefined") {
        getSelectedBoxHelper(transformation, infos, "");
    }
    return infos;
}

function getSelectedElementForTrans(controlGroup, className, kind) {
    let ans = "";
    let controlOperator = controlGroup.getElementsByClassName(className)[0];
    let options = controlOperator.getElementsByTagName("select")[0].getElementsByTagName("option");
    for (let option of options) {
        if (option.selected) {
            ans = kind + option.getAttribute("value");
        }
    }
    return ans;
}

function getApplyInfo(container, kind) {
    let info = [];
    let transformationsContainer = container.getElementsByClassName("transformations-container")[0];
    let transGroup = transformationsContainer.getElementsByClassName("control-group transformation");
    if ((typeof transGroup !== "undefined" || transGroup !== null) && transGroup.length > 0) {
        for (let ele of transGroup) {
            let obj = {};
            let controlTerm = ele.getElementsByClassName("control term")[0];
            let name = "";
            let termInput = controlTerm.getElementsByTagName("input")[0];
            if (termInput.getAttribute("value") !== null ||
                typeof termInput.getAttribute("value") !== "undefined") {
                name = termInput.getAttribute("value");
            }
            let aggregation = getSelectedElementForTrans(ele, "control operators", "");
            let value = getSelectedElementForTrans(ele, "control fields", kind + "_");
            let innerName = {};
            innerName[aggregation] = value;
            obj[name] = innerName;
            info.push(obj);
        }
    }
    return info;
}

function getOrderInfo(container, kind) {
    let obj = {ORDER: {dir: "", keys: []}};
    let orderField = container.getElementsByClassName("control-group")[0].getElementsByClassName("control order fields")[0];
    let options = orderField.getElementsByTagName("select")[0].getElementsByTagName("option");
    for (let option of options) {
        if (option.selected) {
            if (option.getAttribute("class") !== "transformation") {
                obj["ORDER"]["keys"].push(kind + "_" + option.getAttribute("value"));
            } else {
                obj["ORDER"]["keys"].push(option.getAttribute("value"));
            }
        }
    }
    let descending = container.getElementsByClassName("control descending")[0];
    let input = descending.getElementsByTagName("input")[0];
    if (input.checked) {
        obj["ORDER"]["dir"] = "DOWN";
    } else {
        if (obj["ORDER"]["keys"].length > 0) {
            obj["ORDER"]["dir"] = "UP";
        }
    }
    return obj;
}

function getSelectedElementForLogic(container, kind) {
    let operators = container.getElementsByClassName("control operators")[0].getElementsByTagName("select")[0].getElementsByTagName("option");
    let comparison = "";
    let key = "";
    let obj = {};
    let stringKey = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href", "dept", "id", "instructor", "title", "uuid"];
    let numKey = ["lat", "lon", "seats", "avg", "pass", "fail", "audit", "year"];
    for (let operator of operators) {
        if (operator.selected) {
            comparison = operator.getAttribute("value");
        }
    }
    let elements = container.getElementsByClassName("control fields")[0].getElementsByTagName("select")[0].getElementsByTagName("option");
    let fieldKey = "";
    for (let element of elements) {
        if (element.selected) {
            key = kind + "_" + element.getAttribute("value");
            fieldKey = element.getAttribute("value");
        }
    }
    let term = container.getElementsByClassName("control term")[0].getElementsByTagName("input")[0];
    if (typeof term.getAttribute("value") !== "undefined") {
        if (stringKey.includes(fieldKey)) {
            let field = "";
            field = term.getAttribute("value");
            let inner= {};
            inner[key] = field;
            obj[comparison] = inner;
        } else if (numKey.includes(fieldKey)) {
            let field = 0;
            field = Number(term.getAttribute("value"));
            let inner= {};
            inner[key] = field;
            obj[comparison] = inner;
        }
    }
    // if (comparison === "IS") {
    //     let field = "";
    //     if (term.getAttribute("value") !== null || typeof term.getAttribute("value") !== "undefined") {
    //         field = term.getAttribute("value");
    //     }
    //     let inner= {};
    //     inner[key] = field;
    //     obj[comparison] = inner;
    // } else {
    //     let field = 0;
    //     if (term.getAttribute("value") !== null || typeof term.getAttribute("value") !== "undefined") {
    //         field = Number(term.getAttribute("value"));
    //     }
    //     let inner= {};
    //     inner[key] = field;
    //     obj[comparison] = inner;
    // }
    return obj;
}

function getElementInSideLogic(container, kind) {
    let conditionGroups = container.getElementsByClassName("control-group condition");
    let ans = [];
    if (conditionGroups !== null || typeof conditionGroups !== "undefined") {
        for (let ele of conditionGroups) {
            let obj = {};
            if (ele.getElementsByClassName("control not")[0].getElementsByTagName("input")[0].checked) {
                // not
                obj = {NOT: {}};
                obj["NOT"] = getSelectedElementForLogic(ele, kind);
            } else {
                // no not
                obj = getSelectedElementForLogic(ele, kind);
            }
            ans.push(obj);
        }
    }
    return ans;
}

function getConditionInfo(container, kind) {
    let obj = {};
    let conditionType = container.getElementsByClassName("control-group condition-type")[0];
    let conditionContainer = container.getElementsByClassName("conditions-container")[0];
    let ans = getElementInSideLogic(conditionContainer, kind);
    if (conditionType.getElementsByClassName("control conditions-all-radio")[0].
    getElementsByTagName("input")[0].checked) {
        let innerWhere = {};
        if (ans.length <= 0) {
            obj["WHERE"] = {};
        } else if (ans.length === 1) {
            obj["WHERE"] = ans[0];
        } else if (ans.length > 1) {
            innerWhere["AND"] = ans;
            obj["WHERE"] = innerWhere;
        }
        return obj;
    } else if (conditionType.getElementsByClassName("control conditions-any-radio")[0].
    getElementsByTagName("input")[0].checked) {
        let innerWhere = {};
        if (ans.length <= 0) {
            obj["WHERE"] = {};
        } else if (ans.length === 1) {
            obj["WHERE"] = ans[0];
        } else if (ans.length > 1) {
            innerWhere["OR"] = ans;
            obj["WHERE"] = innerWhere;
        }
        return obj;
    } else if (conditionType.getElementsByClassName("control conditions-none-radio")[0].
    getElementsByTagName("input")[0].checked) {
        let innerWhere = {};
        if (ans.length <= 0) {
            obj["WHERE"] = {};
        } else if (ans.length === 1) {
            innerWhere["NOT"] = ans[0];
            obj["WHERE"] = innerWhere;
        } else if (ans.length > 1) {
            let innerNot = {};
            innerNot["OR"] = ans;
            innerWhere["NOT"] = innerNot;
            obj["WHERE"] = innerWhere;
        }
        return obj;
    }
    return obj;
}
