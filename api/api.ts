// src/services/api.ts
import express from "express";
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// need to make the backend server web accessible. 

const router = express.Router();

// GET endpoint - specify zip code in URL
router.get("/doctors/:zipCode", async (req, res) => {
    const { zipCode } = req.params;
    const { specialties } = req.query; // Optional specialties as query parameter
    
    if (!zipCode) {
      return res.status(400).json({ error: "Missing zip code." });
    }
  
    try {
      let allResults: any[] = [];
      
      // Parse specialties if provided as query parameter
      let specialtiesArray: string[] = [];
      if (specialties) {
        if (typeof specialties === 'string') {
          specialtiesArray = specialties.split(',').map(s => s.trim());
        } else if (Array.isArray(specialties)) {
          specialtiesArray = specialties as string[];
        }
      }
      
      // If specialties are provided, search for each specialty
      if (specialtiesArray.length > 0) {
        const searchPromises = specialtiesArray.map(specialty =>
          axios.get(
            `https://npiregistry.cms.hhs.gov/api/?version=2.1&enumeration_type=NPI-1&taxonomy_description=${encodeURIComponent(specialty)}&postal_code=${zipCode}&limit=10`
          )
        );
  
        const responses = await Promise.all(searchPromises);
        allResults = responses.flatMap(response => response.data.results || []);
      } else {
        // If no specialties provided, search for all doctors in the area
        const response = await axios.get(
          `https://npiregistry.cms.hhs.gov/api/?version=2.1&enumeration_type=NPI-1&postal_code=${zipCode}&limit=10`
        );
        allResults = response.data.results || [];
      }
  
      // Remove duplicates based on NPI number
      const uniqueResults = Array.from(
        new Map(allResults.map((doctor: any) => [doctor.number, doctor])).values()
      );
      const allowedFields = ['addresses', 'practiceLocations', 'basic', 'taxonomies'];
      const filteredData = uniqueResults.map(item => {
        const filtered = {};
        allowedFields.forEach(field => {
          if (item[field] !== undefined) {
            filtered[field] = item[field];
          }
        });
        return filtered;
      });
  
      res.json({
        result_count: filteredData.length,
        results: filteredData
      });
    } catch (error) {
      console.error("Error fetching data from NPI Registry API:", error);
      res.status(500).json({ error: "Failed to fetch doctors." });
    }
});

// POST endpoint - original implementation
router.post("/doctors", async (req, res) => {
    const { zipCode, specialties } = req.body;
    if (!zipCode) {
      return res.status(400).json({ error: "Missing zip code." });
    }
  
    try {
      let allResults: any[] = [];
      
      // If specialties are provided, search for each specialty
      if (specialties && specialties.length > 0) {
        const searchPromises = specialties.map(specialty =>
          axios.get(
            `https://npiregistry.cms.hhs.gov/api/?version=2.1&enumeration_type=NPI-1&taxonomy_description=${encodeURIComponent(specialty)}&postal_code=${zipCode}&limit=10`
          )
        );
  
        const responses = await Promise.all(searchPromises);
        allResults = responses.flatMap(response => response.data.results || []);
      } else {
        // If no specialties provided, search for all doctors in the area
        const response = await axios.get(
          `https://npiregistry.cms.hhs.gov/api/?version=2.1&enumeration_type=NPI-1&postal_code=${zipCode}&limit=10`
        );
        allResults = response.data.results || [];
      }
  
      // Remove duplicates based on NPI number
      const uniqueResults = Array.from(
        new Map(allResults.map((doctor: any) => [doctor.number, doctor])).values()
      );
  
      res.json({
        result_count: uniqueResults.length,
        results: uniqueResults
      });
    } catch (error) {
      console.error("Error fetching data from NPI Registry API:", error);
      res.status(500).json({ error: "Failed to fetch doctors." });
    }
  });

export default router;
