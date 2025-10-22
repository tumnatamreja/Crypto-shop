import { Request, Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';

// Get all active cities (global - for admin)
export const getCities = async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT id, name, name_en FROM cities WHERE is_active = true ORDER BY sort_order, name',
      []
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
};

// Get available cities for a specific product
export const getProductCities = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const result = await query(
      `SELECT c.id, c.name, c.name_en
       FROM cities c
       INNER JOIN product_available_cities pac ON c.id = pac.city_id
       WHERE pac.product_id = $1
         AND pac.is_active = true
         AND c.is_active = true
       ORDER BY c.sort_order, c.name`,
      [productId]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching product cities:', error);
    res.status(500).json({ error: 'Failed to fetch product cities' });
  }
};

// Get districts for a specific city (global - for admin)
export const getDistrictsByCity = async (req: Request, res: Response) => {
  try {
    const { cityId } = req.params;

    if (!cityId) {
      return res.status(400).json({ error: 'City ID is required' });
    }

    const result = await query(
      'SELECT id, name, name_en FROM districts WHERE city_id = $1 AND is_active = true ORDER BY sort_order, name',
      [cityId]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching districts:', error);
    res.status(500).json({ error: 'Failed to fetch districts' });
  }
};

// Get available districts for a product in a specific city
export const getProductDistricts = async (req: Request, res: Response) => {
  try {
    const { productId, cityId } = req.params;

    if (!productId || !cityId) {
      return res.status(400).json({ error: 'Product ID and City ID are required' });
    }

    const result = await query(
      `SELECT d.id, d.name, d.name_en
       FROM districts d
       INNER JOIN product_available_districts pad ON d.id = pad.district_id
       WHERE pad.product_id = $1
         AND pad.city_id = $2
         AND pad.is_active = true
         AND d.is_active = true
       ORDER BY d.sort_order, d.name`,
      [productId, cityId]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching product districts:', error);
    res.status(500).json({ error: 'Failed to fetch product districts' });
  }
};

// Admin: Get all cities (including inactive)
export const getAllCitiesAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM cities ORDER BY sort_order, name',
      []
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
};

// Admin: Create city
export const createCity = async (req: AuthRequest, res: Response) => {
  try {
    const { name, name_en, sort_order } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'City name is required' });
    }

    const result = await query(
      'INSERT INTO cities (name, name_en, sort_order) VALUES ($1, $2, $3) RETURNING *',
      [name, name_en || null, sort_order || 0]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating city:', error);

    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'City with this name already exists' });
    }

    res.status(500).json({ error: 'Failed to create city' });
  }
};

// Admin: Update city
export const updateCity = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, name_en, is_active, sort_order } = req.body;

    const result = await query(
      `UPDATE cities
       SET name = COALESCE($1, name),
           name_en = COALESCE($2, name_en),
           is_active = COALESCE($3, is_active),
           sort_order = COALESCE($4, sort_order),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [name, name_en, is_active, sort_order, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'City not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating city:', error);

    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'City with this name already exists' });
    }

    res.status(500).json({ error: 'Failed to update city' });
  }
};

// Admin: Delete city (soft delete by setting is_active = false)
export const deleteCity = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if city has districts
    const districtCheck = await query(
      'SELECT COUNT(*) as count FROM districts WHERE city_id = $1',
      [id]
    );

    if (parseInt(districtCheck.rows[0].count) > 0) {
      // Soft delete
      await query(
        'UPDATE cities SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );

      return res.json({ message: 'City deactivated successfully' });
    }

    // Hard delete if no districts
    const result = await query(
      'DELETE FROM cities WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'City not found' });
    }

    res.json({ message: 'City deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting city:', error);
    res.status(500).json({ error: 'Failed to delete city' });
  }
};

// Admin: Get all districts
export const getAllDistrictsAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT d.*, c.name as city_name
       FROM districts d
       JOIN cities c ON d.city_id = c.id
       ORDER BY c.sort_order, c.name, d.sort_order, d.name`,
      []
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching districts:', error);
    res.status(500).json({ error: 'Failed to fetch districts' });
  }
};

// Admin: Create district
export const createDistrict = async (req: AuthRequest, res: Response) => {
  try {
    const { city_id, name, name_en, sort_order } = req.body;

    if (!city_id || !name) {
      return res.status(400).json({ error: 'City ID and district name are required' });
    }

    const result = await query(
      'INSERT INTO districts (city_id, name, name_en, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [city_id, name, name_en || null, sort_order || 0]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating district:', error);

    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'District with this name already exists in this city' });
    }

    res.status(500).json({ error: 'Failed to create district' });
  }
};

// Admin: Update district
export const updateDistrict = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, name_en, is_active, sort_order } = req.body;

    const result = await query(
      `UPDATE districts
       SET name = COALESCE($1, name),
           name_en = COALESCE($2, name_en),
           is_active = COALESCE($3, is_active),
           sort_order = COALESCE($4, sort_order),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [name, name_en, is_active, sort_order, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'District not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating district:', error);

    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'District with this name already exists in this city' });
    }

    res.status(500).json({ error: 'Failed to update district' });
  }
};

// Admin: Delete district
export const deleteDistrict = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if district is used in any orders
    const orderCheck = await query(
      'SELECT COUNT(*) as count FROM orders WHERE district_id = $1',
      [id]
    );

    if (parseInt(orderCheck.rows[0].count) > 0) {
      // Soft delete
      await query(
        'UPDATE districts SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );

      return res.json({ message: 'District deactivated successfully' });
    }

    // Hard delete if not used
    const result = await query(
      'DELETE FROM districts WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'District not found' });
    }

    res.json({ message: 'District deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting district:', error);
    res.status(500).json({ error: 'Failed to delete district' });
  }
};

// ============================================================
// PRODUCT LOCATION MANAGEMENT (ADMIN)
// ============================================================

// Get product's available cities
export const getProductAvailableCities = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;

    const result = await query(
      `SELECT c.id, c.name, c.name_en, pac.is_active
       FROM cities c
       INNER JOIN product_available_cities pac ON c.id = pac.city_id
       WHERE pac.product_id = $1
       ORDER BY c.sort_order, c.name`,
      [productId]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching product cities:', error);
    res.status(500).json({ error: 'Failed to fetch product cities' });
  }
};

// Get product's available districts for a city
export const getProductAvailableDistricts = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, cityId } = req.params;

    const result = await query(
      `SELECT d.id, d.name, d.name_en, pad.is_active
       FROM districts d
       INNER JOIN product_available_districts pad ON d.id = pad.district_id
       WHERE pad.product_id = $1 AND pad.city_id = $2
       ORDER BY d.sort_order, d.name`,
      [productId, cityId]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching product districts:', error);
    res.status(500).json({ error: 'Failed to fetch product districts' });
  }
};

// Add city to product
export const addCityToProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, cityId } = req.body;

    if (!productId || !cityId) {
      return res.status(400).json({ error: 'Product ID and City ID are required' });
    }

    // Insert or activate
    await query(
      `INSERT INTO product_available_cities (product_id, city_id, is_active)
       VALUES ($1, $2, true)
       ON CONFLICT (product_id, city_id)
       DO UPDATE SET is_active = true`,
      [productId, cityId]
    );

    res.json({ message: 'City added to product successfully' });
  } catch (error: any) {
    console.error('Error adding city to product:', error);
    res.status(500).json({ error: 'Failed to add city to product' });
  }
};

// Remove city from product
export const removeCityFromProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, cityId } = req.params;

    // Soft delete (deactivate)
    await query(
      'UPDATE product_available_cities SET is_active = false WHERE product_id = $1 AND city_id = $2',
      [productId, cityId]
    );

    // Also deactivate all districts for this city
    await query(
      'UPDATE product_available_districts SET is_active = false WHERE product_id = $1 AND city_id = $2',
      [productId, cityId]
    );

    res.json({ message: 'City removed from product successfully' });
  } catch (error: any) {
    console.error('Error removing city from product:', error);
    res.status(500).json({ error: 'Failed to remove city from product' });
  }
};

// Add district to product
export const addDistrictToProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, cityId, districtId } = req.body;

    if (!productId || !cityId || !districtId) {
      return res.status(400).json({ error: 'Product ID, City ID, and District ID are required' });
    }

    // Insert or activate
    await query(
      `INSERT INTO product_available_districts (product_id, city_id, district_id, is_active)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (product_id, district_id)
       DO UPDATE SET is_active = true`,
      [productId, cityId, districtId]
    );

    res.json({ message: 'District added to product successfully' });
  } catch (error: any) {
    console.error('Error adding district to product:', error);
    res.status(500).json({ error: 'Failed to add district to product' });
  }
};

// Remove district from product
export const removeDistrictFromProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, districtId } = req.params;

    // Soft delete (deactivate)
    await query(
      'UPDATE product_available_districts SET is_active = false WHERE product_id = $1 AND district_id = $2',
      [productId, districtId]
    );

    res.json({ message: 'District removed from product successfully' });
  } catch (error: any) {
    console.error('Error removing district from product:', error);
    res.status(500).json({ error: 'Failed to remove district from product' });
  }
};

// Bulk update product locations
export const bulkUpdateProductLocations = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, cities, districts } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Deactivate all current locations
    await query('UPDATE product_available_cities SET is_active = false WHERE product_id = $1', [productId]);
    await query('UPDATE product_available_districts SET is_active = false WHERE product_id = $1', [productId]);

    // Add/activate selected cities
    if (cities && Array.isArray(cities)) {
      for (const cityId of cities) {
        await query(
          `INSERT INTO product_available_cities (product_id, city_id, is_active)
           VALUES ($1, $2, true)
           ON CONFLICT (product_id, city_id)
           DO UPDATE SET is_active = true`,
          [productId, cityId]
        );
      }
    }

    // Add/activate selected districts
    if (districts && Array.isArray(districts)) {
      for (const district of districts) {
        await query(
          `INSERT INTO product_available_districts (product_id, city_id, district_id, is_active)
           VALUES ($1, $2, $3, true)
           ON CONFLICT (product_id, district_id)
           DO UPDATE SET is_active = true`,
          [productId, district.cityId, district.districtId]
        );
      }
    }

    res.json({ message: 'Product locations updated successfully' });
  } catch (error: any) {
    console.error('Error updating product locations:', error);
    res.status(500).json({ error: 'Failed to update product locations' });
  }
};
