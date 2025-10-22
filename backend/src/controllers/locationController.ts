import { Request, Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';

// Get all active cities
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

// Get districts for a specific city
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
