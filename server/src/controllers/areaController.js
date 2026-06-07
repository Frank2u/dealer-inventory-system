import prisma from '../prisma.js';

export const getAllAreas = async (req, res, next) => {
  try {
    const areas = await prisma.areaMapping.findMany({
      orderBy: { areaName: 'asc' }
    });
    res.json(areas);
  } catch (error) {
    next(error);
  }
};

export const createArea = async (req, res, next) => {
  try {
    const { areaName, codePrefix } = req.body;

    if (!areaName || !codePrefix) {
      return res.status(400).json({ message: 'Area name and code prefix are required' });
    }

    const nameUpper = areaName.trim();
    const prefixUpper = codePrefix.trim().toUpperCase();

    // Check if areaName already exists
    const existingName = await prisma.areaMapping.findUnique({
      where: { areaName: nameUpper }
    });
    if (existingName) {
      return res.status(400).json({ message: `Area with name "${nameUpper}" already exists` });
    }

    // Check if codePrefix already exists
    const existingPrefix = await prisma.areaMapping.findUnique({
      where: { codePrefix: prefixUpper }
    });
    if (existingPrefix) {
      return res.status(400).json({ message: `Area code prefix "${prefixUpper}" already exists` });
    }

    const area = await prisma.areaMapping.create({
      data: {
        areaName: nameUpper,
        codePrefix: prefixUpper
      }
    });

    res.status(201).json(area);
  } catch (error) {
    next(error);
  }
};

export const updateArea = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { areaName, codePrefix } = req.body;

    const existingArea = await prisma.areaMapping.findUnique({
      where: { id }
    });
    if (!existingArea) {
      return res.status(404).json({ message: 'Area mapping not found' });
    }

    const nameUpper = areaName ? areaName.trim() : undefined;
    const prefixUpper = codePrefix ? codePrefix.trim().toUpperCase() : undefined;

    // Check if name is taken by other area
    if (nameUpper && nameUpper !== existingArea.areaName) {
      const duplicateName = await prisma.areaMapping.findUnique({
        where: { areaName: nameUpper }
      });
      if (duplicateName) {
        return res.status(400).json({ message: `Area with name "${nameUpper}" already exists` });
      }
    }

    // Check if prefix is taken by other area
    if (prefixUpper && prefixUpper !== existingArea.codePrefix) {
      const duplicatePrefix = await prisma.areaMapping.findUnique({
        where: { codePrefix: prefixUpper }
      });
      if (duplicatePrefix) {
        return res.status(400).json({ message: `Area code prefix "${prefixUpper}" already exists` });
      }
    }

    const updatedArea = await prisma.areaMapping.update({
      where: { id },
      data: {
        areaName: nameUpper,
        codePrefix: prefixUpper
      }
    });

    res.json(updatedArea);
  } catch (error) {
    next(error);
  }
};

export const deleteArea = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingArea = await prisma.areaMapping.findUnique({
      where: { id }
    });
    if (!existingArea) {
      return res.status(404).json({ message: 'Area mapping not found' });
    }

    // Block deletion if any shops are registered under this area
    const shopCount = await prisma.shop.count({
      where: { area: existingArea.areaName }
    });
    if (shopCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete area "${existingArea.areaName}" because it is currently assigned to ${shopCount} registered shop(s).` 
      });
    }

    await prisma.areaMapping.delete({
      where: { id }
    });

    res.json({ message: 'Area mapping deleted successfully' });
  } catch (error) {
    next(error);
  }
};
