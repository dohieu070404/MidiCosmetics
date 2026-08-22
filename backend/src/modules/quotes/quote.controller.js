import { asyncHandler } from '../../utils/async-handler.js';
import { HTTP_STATUS } from '../../constants/http-status.js';
import { quoteService } from './quote.service.js';

const ok = (res, message, data = {}) => res.success({ statusCode: HTTP_STATUS.OK, message, data });
const created = (res, message, data = {}) =>
  res.success({ statusCode: HTTP_STATUS.CREATED, message, data });

export const quoteController = {
  create: asyncHandler(async (req, res) =>
    created(
      res,
      'Đã mở Messenger và ghi nhận phiếu yêu cầu',
      await quoteService.create(req.validated.body, req),
    ),
  ),
  get: asyncHandler(async (req, res) =>
    ok(res, 'Đã tải phiếu yêu cầu', {
      quote: await quoteService.getPublic(req.validated.params.token),
    }),
  ),
  messengerOpened: asyncHandler(async (req, res) =>
    ok(res, 'Đã ghi nhận mở Messenger', {
      quote: await quoteService.messengerOpened(req.validated.params.token, req),
    }),
  ),
  track: asyncHandler(async (req, res) =>
    ok(res, 'Đã ghi nhận mức quan tâm', {
      accepted: await quoteService.track(req.validated.body, req),
    }),
  ),
};
