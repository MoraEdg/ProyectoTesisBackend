const svc = require('./catalogos.service');
const { ok } = require('../../helpers/response');
const { asyncHandler } = require('../../helpers/response');

exports.roles    = asyncHandler(async (req, res) => ok(res, await svc.getRoles()));
exports.estados  = asyncHandler(async (req, res) => ok(res, await svc.getEstados(req.query.categoria)));
exports.procesos = asyncHandler(async (req, res) => ok(res, await svc.getTiposProceso()));
exports.convenios= asyncHandler(async (req, res) => ok(res, await svc.getTiposConvenio()));
exports.periodos = asyncHandler(async (req, res) => ok(res, await svc.getPeriodos()));
exports.tiposDocGenerado = asyncHandler(async (req, res) => ok(res, await svc.getTiposDocumentoGenerado()));
