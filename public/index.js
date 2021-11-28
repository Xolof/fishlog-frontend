"use strict";

import { helpers } from "./helpers.js";
import { add } from "./add.js";
import { show } from "./show.js";
import { showMap } from "./showMap.js";
import { login } from "./login.js";
import { state } from './state.js';

const main = async function() {
    if (await state.verifyToken()) {
        state.setLoggedIn(true);
    };

    const nav = document.getElementsByClassName("main_nav")[0];
    nav.innerHTML = `
    <a id="nav_add">Add catch</a>
    <a id="nav_show">Show list</a>
    <a id="nav_showMap">Show map</a>
    <a id="nav_login">${ state.getLoggedIn() ? "Logout" : "Login" }</a>`;

    add.init();

    helpers.addListener("click", helpers.getId("nav_add"), (e) => {
        helpers.resetContent();
        add.init();
    });

    helpers.addListener("click", helpers.getId("nav_show"), (e) => {
        helpers.resetContent();
        show.init();
    });

    helpers.addListener("click", helpers.getId("nav_showMap"), (e) => {
        helpers.resetContent();
        showMap.init();
    });

    helpers.addListener("click", helpers.getId("nav_login"), async (e) => {
        helpers.resetContent();
        if (!state.getLoggedIn()) {
            login.init();
        } else {
            await login.logout();
            add.init();
        }
    });
}();
