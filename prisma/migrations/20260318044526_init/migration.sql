-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "firstName" VARCHAR(191),
    "lastName" VARCHAR(191),
    "email" TEXT,
    "studentId" VARCHAR(191),
    "address" TEXT,
    "program" VARCHAR(191),
    "sex" VARCHAR(50),
    "latinHonor" VARCHAR(191),
    "graduationYear" INTEGER,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diploma" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "course" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "grade" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending_clearance',
    "txHash" VARCHAR(255),
    "ipfsHash" VARCHAR(255),
    "certificateId" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Diploma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiplomaSettings" (
    "id" SERIAL NOT NULL,
    "campusRegistrar" TEXT NOT NULL,
    "campusAdministrator" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiplomaSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Diploma" ADD CONSTRAINT "Diploma_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
