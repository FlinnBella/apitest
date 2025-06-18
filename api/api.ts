// src/services/api.ts
import express from "express";
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// need to make the backend server web accessible. 

const router = express.Router();




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
