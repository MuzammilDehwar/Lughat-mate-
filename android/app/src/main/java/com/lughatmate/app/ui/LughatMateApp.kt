package com.lughatmate.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController

sealed class Screen(val route: String, val titleUrdu: String) {
    object Home : Screen("home", "صفحہ اول")
    object Dictionary : Screen("dictionary", "لغت")
    object TextStudy : Screen("text_study", "مطالعہ")
    object Practice : Screen("practice", "تمرین")
    object Library : Screen("library", "لائبریری")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LughatMateApp() {
    val navController = rememberNavController()
    var currentRoute by remember { mutableStateOf(Screen.Home.route) }

    val navItems = listOf(
        Screen.Home to Icons.Default.Home,
        Screen.Dictionary to Icons.Default.Book,
        Screen.TextStudy to Icons.Default.Description,
        Screen.Practice to Icons.Default.School,
        Screen.Library to Icons.Default.LocalLibrary
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "لُغَتْ مِیْٹ — عربی تعلیمی ساتھی",
                        style = MaterialTheme.typography.titleMedium
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary
                ),
                actions = {
                    IconButton(onClick = { /* Open settings */ }) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = "ترتیبات",
                            tint = MaterialTheme.colorScheme.onPrimary
                        )
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar {
                navItems.forEach { (screen, icon) ->
                    val isSelected = currentRoute == screen.route
                    NavigationBarItem(
                        selected = isSelected,
                        onClick = {
                            currentRoute = screen.route
                            navController.navigate(screen.route) {
                                popUpTo(navController.graph.startDestinationId) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { Icon(icon, contentDescription = screen.titleUrdu) },
                        label = { Text(screen.titleUrdu) }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Home.route,
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            composable(Screen.Home.route) {
                HomeScreenView(
                    onNavigateToDict = { navController.navigate(Screen.Dictionary.route) },
                    onNavigateToStudy = { navController.navigate(Screen.TextStudy.route) }
                )
            }
            composable(Screen.Dictionary.route) {
                DictionaryScreenView()
            }
            composable(Screen.TextStudy.route) {
                TextStudyScreenView()
            }
            composable(Screen.Practice.route) {
                PracticeScreenView()
            }
            composable(Screen.Library.route) {
                LibraryScreenView()
            }
        }
    }
}

@Composable
fun HomeScreenView(onNavigateToDict: () -> Unit, onNavigateToStudy: () -> Unit) {
    Column(modifier = Modifier.padding(16.dp)) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ", style = MaterialTheme.typography.labelSmall)
                Spacer(modifier = Modifier.height(8.dp))
                Text("لغت میٹ میں خوش آمدید", style = MaterialTheme.typography.headlineMedium)
                Text("کلاسیکی عربی فہم اور اردو تراجم کا مستند آف لائن ساتھی", style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}

@Composable
fun DictionaryScreenView() {
    Column(modifier = Modifier.padding(16.dp)) {
        Text("عربی–اردو لغت", style = MaterialTheme.typography.headlineMedium)
        Text("اعراب سے بے نیاز سرچ کے ساتھ تلاش کریں", style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
fun TextStudyScreenView() {
    Column(modifier = Modifier.padding(16.dp)) {
        Text("مطالعۂ متن ورک اسپیس", style = MaterialTheme.typography.headlineMedium)
        Text("کسی بھی عربی عبارت پر ٹیپ کر کے فوری معانی دیکھیں", style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
fun PracticeScreenView() {
    Column(modifier = Modifier.padding(16.dp)) {
        Text("تمرین و مراجعہ", style = MaterialTheme.typography.headlineMedium)
        Text("فلیش کارڈز اور چار انتخابی کوئز", style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
fun LibraryScreenView() {
    Column(modifier = Modifier.padding(16.dp)) {
        Text("ذاتی لائبریری", style = MaterialTheme.typography.headlineMedium)
        Text("محفوظ شدہ الفاظ و عبارات", style = MaterialTheme.typography.bodyMedium)
    }
}
