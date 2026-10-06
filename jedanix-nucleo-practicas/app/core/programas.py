"""Catálogo de programas académicos (CU-01, paso 11: "el Director selecciona el
programa académico al que pertenece" el estudiante).

Es una lista controlada en código, no una tabla: el modelo de datos vigente
guarda `programa_academico` como texto y ningún CU pide administrar el catálogo.
Para agregar, quitar o renombrar programas basta con editar esta lista; los
usuarios ya creados conservan el valor que tenían.
"""
from __future__ import annotations

PROGRAMAS_ACADEMICOS: tuple[str, ...] = (
    "Administración de Empresas",
    "Contaduría Pública",
    "Derecho",
    "Enfermería",
    "Ingeniería Ambiental",
    "Ingeniería Civil",
    "Ingeniería de Sistemas",
    "Ingeniería Electrónica",
    "Ingeniería Industrial",
    "Psicología",
)
