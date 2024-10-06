// File: pages/api/loadFile.ts

import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  try {
    // Specify the path to your text file
    const filePath = path.join(process.cwd(), 'data', '/home/cybernovas/Desktop/2024/gita-gpt/ask_krishna/data/English-Bhagavad-gita-His-Divine-Grace-AC-Bhaktivedanta-Swami-Prabhupada.txt')

    // Read the file synchronously
    const fileContent = fs.readFileSync(filePath, 'utf8')

    // Return the file content
    res.status(200).json({ content: fileContent })
  } catch (error) {
    console.error('Error reading file:', error)
    res.status(500).json({ message: 'Error reading file' })
  }
}