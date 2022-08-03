using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Web;
using Newtonsoft.Json;

namespace WebApplication1.ashx
{
    /// <summary>
    /// GetRecordsHandler 的摘要說明
    /// </summary>
    public class GetRecordsHandler : IHttpHandler
    {
        /// <summary>
        /// 連接字符串
        /// </summary>
        private static string ConnectionString = ConfigurationManager.ConnectionStrings["ConnectionString"].ToString();

        public void ProcessRequest(HttpContext context)
        {
            context.Response.ContentType = "text/plain";

            // 獲取分頁參數
            int pageSize = int.Parse(context.Request["pageSize"].ToString());
            int pageNumber = int.Parse(context.Request["pageNumber"].ToString());

            // 獲取自定義參數
            string name = context.Request["name"].ToString();
            string gender = context.Request["gender"].ToString();

            // 記錄總數
            int total = GetRecordsCount(name, gender);
            DataTable dataTable = GetRecords(pageSize, pageNumber, name, gender);

            // 格式化數據
            var data = new { total = total, rows = dataTable };
            context.Response.Write(JsonConvert.SerializeObject(data));
        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }

        // 獲取記錄總數
        private int GetRecordsCount(string name, string gender)
        {
            // 查詢語句
            StringBuilder sql = new StringBuilder("select count(*) from [TPerson] ");
            if (!string.IsNullOrWhiteSpace(name) && !string.IsNullOrWhiteSpace(gender))
            {
                sql.Append("where Name=@Name and Gender=@Gender");
            }
            else if (!string.IsNullOrWhiteSpace(name) && string.IsNullOrWhiteSpace(gender))
            {
                sql.Append("where Name=@Name");
            }
            else if (string.IsNullOrWhiteSpace(name) && !string.IsNullOrWhiteSpace(gender))
            {
                sql.Append("where Gender=@Gender");
            }
            else
            {
                sql.Append("");
            }

            // 查詢參數
            List<SqlParameter> parameters = new List<SqlParameter>();
            if (!string.IsNullOrWhiteSpace(name))
            {
                parameters.Add(new SqlParameter("@Name", name));
            }
            if (!string.IsNullOrWhiteSpace(gender))
            {
                parameters.Add(new SqlParameter("@Gender", gender));
            }

            // 查詢總數
            using (SqlConnection connection = new SqlConnection(ConnectionString))
            {
                SqlCommand command = new SqlCommand(sql.ToString(), connection);
                if (parameters.Count > 0)
                {
                    command.Parameters.AddRange(parameters.ToArray());
                }
                try
                {
                    connection.Open();
                    return Convert.ToInt32(command.ExecuteScalar());
                }
                catch
                {
                    return -1;
                }
            }
        }

        // 分頁查詢數據
        private DataTable GetRecords(int pageSize, int pageNumber, string name, string gender)
        {
            // 查詢語句
            StringBuilder sql = new StringBuilder("select * from(select row_number() over(order by Id) as RowId, *from TPerson ");
            if (!string.IsNullOrWhiteSpace(name) && !string.IsNullOrWhiteSpace(gender))
            {
                sql.Append("where Name=@Name and Gender=@Gender) ");
            }
            else if (!string.IsNullOrWhiteSpace(name) && string.IsNullOrWhiteSpace(gender))
            {
                sql.Append("where Name=@Name) ");
            }
            else if (string.IsNullOrWhiteSpace(name) && !string.IsNullOrWhiteSpace(gender))
            {
                sql.Append("where Gender=@Gender) ");
            }
            else
            {
                sql.Append(") ");
            }
            sql.Append("as b where b.Id between (@pageNumber - 1) * @pageSize + 1 and @pageNumber * @pageSize order by Id");

            // 查詢參數
            List<SqlParameter> parameters = new List<SqlParameter>();
            parameters.Add(new SqlParameter("@pageSize", pageSize));
            parameters.Add(new SqlParameter("@pageNumber", pageNumber));
            if (!string.IsNullOrWhiteSpace(name))
            {
                parameters.Add(new SqlParameter("@Name", name));
            }
            if (!string.IsNullOrWhiteSpace(gender))
            {
                parameters.Add(new SqlParameter("@Gender", gender));
            }

            // 查詢數據
            DataTable dataTable = new DataTable();
            using (SqlDataAdapter adapter = new SqlDataAdapter(sql.ToString(), ConnectionString))
            {
                adapter.SelectCommand.Parameters.AddRange(parameters.ToArray());
                adapter.Fill(dataTable);
            }
            return dataTable;
        }
    }
}