const mongoose = require('mongoose');
const CarouselSlide = require('../models/CarouselSlide');
const { saveUploadedFile } = require('../utils/localUpload');
const { normalizeCarouselSlide } = require('../utils/mediaUrl');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const allowedImageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const uploadSingleImage = async (file) => {
  if (!file) return null;
  if (!allowedImageMimeTypes.includes(file.mimetype)) {
    return { error: 'Image must be jpeg, jpg, png, or webp' };
  }
  const saved = await saveUploadedFile(file, 'carousel');
  if (saved?.error) {
    return { error: saved.error };
  }
  return { url: saved.url };
};

// GET /api/carousel — public: active slides only, ordered
exports.getActiveCarousel = async (req, res) => {
  try {
    const slides = await CarouselSlide.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .select('imageUrl title linkUrl sortOrder createdAt updatedAt')
      .lean();

    return res.status(200).json({
      success: true,
      data: slides.map(normalizeCarouselSlide),
      count: slides.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/carousel/admin — admin: all slides
exports.getAllCarouselAdmin = async (req, res) => {
  try {
    const slides = await CarouselSlide.find()
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: slides.map(normalizeCarouselSlide),
      count: slides.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/carousel/admin/:id — admin: one slide
exports.getCarouselById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const slide = await CarouselSlide.findById(id).lean();
    if (!slide) {
      return res.status(404).json({ success: false, message: 'Slide not found' });
    }
    return res.status(200).json({ success: true, data: normalizeCarouselSlide(slide) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/carousel — admin: create (multipart: image required)
exports.createCarouselSlide = async (req, res) => {
  try {
    const title = req.body.title ?? req.body.alt ?? '';
    const linkUrl = req.body.linkUrl ?? '';
    const sortOrder = req.body.sortOrder ?? req.body.order;
    const { isActive } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'Image file is required (field name: image)' });
    }

    const uploaded = await uploadSingleImage(file);
    if (uploaded?.error) {
      return res.status(400).json({ success: false, message: uploaded.error });
    }

    const parsedOrder = sortOrder !== undefined && sortOrder !== '' ? Number(sortOrder) : 0;
    const order = Number.isNaN(parsedOrder) ? 0 : parsedOrder;

    const slide = await CarouselSlide.create({
      imageUrl: uploaded.url,
      title: String(title).trim(),
      linkUrl: String(linkUrl).trim(),
      sortOrder: order,
      isActive: isActive === undefined || isActive === '' ? true : String(isActive) === 'true',
      createdBy: req.user?._id,
      updatedBy: req.user?._id,
    });

    return res.status(201).json({ success: true, message: 'Carousel slide created', data: slide });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/carousel/:id — admin: update (optional new image)
exports.updateCarouselSlide = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const slide = await CarouselSlide.findById(id);
    if (!slide) {
      return res.status(404).json({ success: false, message: 'Slide not found' });
    }

    const { title, linkUrl, sortOrder, isActive, alt, order } = req.body;

    if (title !== undefined || alt !== undefined) {
      slide.title = String(title ?? alt ?? '').trim();
    }
    if (linkUrl !== undefined) slide.linkUrl = String(linkUrl).trim();
    const orderValue = sortOrder ?? order;
    if (orderValue !== undefined && orderValue !== '') {
      const o = Number(orderValue);
      if (!Number.isNaN(o)) slide.sortOrder = o;
    }
    if (isActive !== undefined && isActive !== '') {
      slide.isActive = String(isActive) === 'true';
    }

    if (req.file) {
      const uploaded = await uploadSingleImage(req.file);
      if (uploaded?.error) {
        return res.status(400).json({ success: false, message: uploaded.error });
      }
      slide.imageUrl = uploaded.url;
    }

    slide.updatedBy = req.user?._id;
    await slide.save();

    return res.status(200).json({ success: true, message: 'Carousel slide updated', data: slide });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/carousel/:id — admin
exports.deleteCarouselSlide = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const slide = await CarouselSlide.findByIdAndDelete(id);
    if (!slide) {
      return res.status(404).json({ success: false, message: 'Slide not found' });
    }

    return res.status(200).json({ success: true, message: 'Carousel slide deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
