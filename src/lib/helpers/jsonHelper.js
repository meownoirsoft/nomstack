import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

/**
 * Adds a new row to the specified JSON file.
 * @param {string} filePath - Path to the JSON file.
 * @param {Object} newRow - The new row to add.
 * @returns {Object[]} - The updated content of the JSON file.
 */
export function addRowToJson(filePath, newRow) {
  try {
    // Resolve the file path
    const absolutePath = path.resolve(filePath);

    // Read the existing data
    const data = JSON.parse(readFileSync(absolutePath, 'utf-8'));
    newRow.id = data.length + 1;
    
    // Add the new row
    data.push(newRow);

    // Write the updated data back to the file
    writeFileSync(absolutePath, JSON.stringify(data, null, 2), 'utf-8');

    // Return the updated data
    return data;
  } catch (error) {
    console.error(`Error adding row to JSON file: ${error.message}`);
    throw error;
  }
}

export function updateRowInJson(filePath, updatedRow) {
    try {
        // Resolve the file path
        const absolutePath = path.resolve(filePath);

        // Read the existing data
        const data = JSON.parse(readFileSync(absolutePath, 'utf-8'));

        // Find the index of the row to update
        const index = data.findIndex((row) => row.id === updatedRow.id);

        // Update the row
        data[index] = updatedRow;

        // Write the updated data back to the file
        writeFileSync
            (absolutePath, JSON.stringify(data, null, 2), 'utf-8');

        // Return the updated data
        return data;
    } catch (error) {
        console.error(`Error updating row in JSON file: ${error.message}`);
        throw error;
    }
}

export function deleteRowInJson(filePath, deletedId) {
    try {
        // Resolve the file path
        const absolutePath = path.resolve(filePath);

        // Read the existing data
        const data = JSON.parse(readFileSync(absolutePath, 'utf-8'));

        // Find the index of the row to update
        const index = data.findIndex((row) => row.id === deletedId);
        
        // Update the row
        data.splice(index, 1);

        // Write the updated data back to the file
        writeFileSync
            (absolutePath, JSON.stringify(data, null, 2), 'utf-8');

        // Return the updated data
        return data;
    } catch (error) {
        console.error(`Error updating row in JSON file: ${error.message}`);
        throw error;
    }
}