var Coroutine = function(f, params) {
    var o = f(params); // instantiate the coroutine
    o.next(); // execute until the first yield

    return function (x) {
        o.next(x);
    };
};

// export in common js
if (typeof module !== "undefined" && ('exports' in module)) {
    module.exports = Coroutine;
}