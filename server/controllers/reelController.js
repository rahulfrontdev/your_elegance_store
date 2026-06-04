const mongoose = require('mongoose');
const Reel = require('../models/Reel');

const success = (res, status, message, data = null) =>
  res.status(status).json({ success: true, message, data });

const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const parseBoolean = (value, defaultValue) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;

  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;

  return null;
};

const extractInstagramUrl = (value) => {
  const input = String(value || '').trim().replace(/&amp;/g, '&');
  const iframeSrc = input.match(/src=["']([^"']+)["']/i);
  return iframeSrc ? iframeSrc[1].trim() : input;
};

const parseInstagramReelInput = (inputValue) => {
  let parsedUrl;
  const instagramUrl = extractInstagramUrl(inputValue);

  try {
    parsedUrl = new URL(instagramUrl);
  } catch (error) {
    return null;
  }

  if (!['www.instagram.com', 'instagram.com'].includes(parsedUrl.hostname.toLowerCase())) {
    return null;
  }

  const parts = parsedUrl.pathname.split('/').filter(Boolean);
  if (parts[0] !== 'reel' || !parts[1]) {
    return null;
  }

  const shortcode = parts[1].trim();
  if (!/^[A-Za-z0-9_-]+$/.test(shortcode)) {
    return null;
  }

  return {
    shortcode,
    reelUrl: `https://www.instagram.com/reel/${shortcode}/`,
    embedUrl: `https://www.instagram.com/reel/${shortcode}/embed/`,
  };
};

const buildReelPayload = (body, isCreate = false) => {
  const payload = {};

  if (body.title !== undefined || isCreate) {
    const title = String(body.title || '').trim();
    if (!title) return { error: 'Title is required' };
    if (title.length < 2 || title.length > 120) {
      return { error: 'Title must be between 2 and 120 characters' };
    }
    payload.title = title;
  }

  if (body.reelUrl !== undefined || body.embedUrl !== undefined || isCreate) {
    const reelInput = String(body.embedUrl || body.reelUrl || '').trim();
    const parsedReel = parseInstagramReelInput(reelInput);

    if (!reelInput) return { error: 'Instagram reel embed URL is required' };
    if (!parsedReel) {
      return { error: 'Please provide a valid Instagram reel embed URL or iframe code' };
    }

    payload.reelUrl = parsedReel.reelUrl;
    payload.shortcode = parsedReel.shortcode;
    payload.embedUrl = parsedReel.embedUrl;
  }

  if (body.thumbnail !== undefined) {
    payload.thumbnail = String(body.thumbnail || '').trim();
  }

  if (body.videoUrl !== undefined) {
    payload.videoUrl = String(body.videoUrl || '').trim();
  }

  if (body.isActive !== undefined) {
    const isActive = parseBoolean(body.isActive);
    if (isActive === null) return { error: 'isActive must be true or false' };
    payload.isActive = isActive;
  } else if (isCreate) {
    payload.isActive = true;
  }

  if (body.displayOrder !== undefined) {
    const displayOrder = Number.parseInt(String(body.displayOrder), 10);
    if (Number.isNaN(displayOrder) || displayOrder < 0) {
      return { error: 'displayOrder must be a positive number' };
    }
    payload.displayOrder = displayOrder;
  } else if (isCreate) {
    payload.displayOrder = 0;
  }

  return { payload };
};

const canViewInactive = (req) =>
  req.query.all === 'true' && req.user && req.user.role === 'admin';

exports.createReel = async (req, res) => {
  try {
    const { payload, error } = buildReelPayload(req.body, true);
    if (error) return fail(res, 400, error);

    const existing = await Reel.findOne({ shortcode: payload.shortcode }).lean();
    if (existing) {
      return fail(res, 409, 'This Instagram reel already exists');
    }

    const reel = await Reel.create(payload);
    return success(res, 201, 'Reel created successfully', reel);
  } catch (error) {
    if (error.code === 11000) {
      return fail(res, 409, 'This Instagram reel already exists');
    }
    return fail(res, 500, error.message);
  }
};

exports.getReels = async (req, res) => {
  try {
    const filter = canViewInactive(req) ? {} : { isActive: true };
    const reels = await Reel.find(filter)
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    return success(res, 200, 'Reels fetched successfully', reels);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

exports.getReelById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return fail(res, 400, 'Invalid reel id');
    }

    const reel = await Reel.findById(id).lean();
    if (!reel || (!canViewInactive(req) && reel.isActive === false)) {
      return fail(res, 404, 'Reel not found');
    }

    return success(res, 200, 'Reel fetched successfully', reel);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

exports.updateReel = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return fail(res, 400, 'Invalid reel id');
    }

    const { payload, error } = buildReelPayload(req.body);
    if (error) return fail(res, 400, error);

    if (Object.keys(payload).length === 0) {
      return fail(res, 400, 'At least one field is required to update');
    }

    if (payload.shortcode) {
      const existing = await Reel.findOne({
        shortcode: payload.shortcode,
        _id: { $ne: id },
      }).lean();

      if (existing) {
        return fail(res, 409, 'This Instagram reel already exists');
      }
    }

    const reel = await Reel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!reel) {
      return fail(res, 404, 'Reel not found');
    }

    return success(res, 200, 'Reel updated successfully', reel);
  } catch (error) {
    if (error.code === 11000) {
      return fail(res, 409, 'This Instagram reel already exists');
    }
    return fail(res, 500, error.message);
  }
};

exports.deleteReel = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return fail(res, 400, 'Invalid reel id');
    }

    const reel = await Reel.findByIdAndDelete(id);
    if (!reel) {
      return fail(res, 404, 'Reel not found');
    }

    return success(res, 200, 'Reel deleted successfully');
  } catch (error) {
    return fail(res, 500, error.message);
  }
};
